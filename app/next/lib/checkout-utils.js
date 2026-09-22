const { createHash } = require('crypto')
const nodemailer = require('nodemailer')
const PaymentUtils = require('./payment-utils')
const { buildBrandedEmail } = require('./email-template')

const EMAIL = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/i
const REQUEST_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const SETTLED = ['submitted_for_settlement', 'settling', 'settled', 'settlement_pending']

function sanitizeText (value = '', maximum, options = {}) {
  const required = options.required === true
  const multiline = options.multiline === true
  const message = options.message || 'Invalid details'
  if (typeof value !== 'string' || value.length > maximum || (required && !value.trim())) {
    throw new Error(message)
  }
  const hasControlCharacter = Array.from(value).some(character => {
    if (multiline && '\n\r\t'.includes(character)) return false
    return character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127
  })
  if (hasControlCharacter) throw new Error(message)
  return value.trim()
}

function requireEmail (value) {
  const email = sanitizeText(value, 254, { required: true, message: 'Invalid email' })
  if (!EMAIL.test(email)) throw new Error('Invalid email')
  return email
}

function requireRequestId (value) {
  if (typeof value !== 'string' || !REQUEST_ID.test(value)) throw new Error('Invalid request ID')
  return value.toLowerCase()
}

function requireStreetAddress (value) {
  return sanitizeText(value, 255, {
    required: true,
    message: 'Please enter your street address before submitting payment.'
  })
}

async function allowRequest (req, model, collectionName) {
  const limits = model.db.collection(collectionName)
  await limits.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
  const window = Math.floor(Date.now() / 600000)
  const ip = req.ip || req.socket.remoteAddress
  const key = createHash('sha256').update(`${req.method}:${ip}:${window}`).digest('hex')
  const maximum = req.method === 'GET' ? 30 : 10
  const update = {
    $inc: { count: 1 },
    $setOnInsert: { expiresAt: new Date((window + 2) * 600000) }
  }
  let result
  try {
    result = await limits.findOneAndUpdate({ _id: key }, update, { upsert: true, returnDocument: 'after' })
  } catch (error) {
    if (error.code !== 11000) throw error
    result = await limits.findOneAndUpdate({ _id: key }, update, { returnDocument: 'after' })
  }
  return result.value && result.value.count <= maximum
}

function requestOrigin (req) {
  if (req.headers.origin) return req.headers.origin
  try {
    return req.headers.referer ? new URL(req.headers.referer).origin : null
  } catch (_) {
    return null
  }
}

function trustedOrigin (req) {
  const configured = process.env.DONATION_SITE_ORIGIN
  const origin = requestOrigin(req)
  if (configured && origin === configured) return configured
  if (process.env.NODE_ENV !== 'production' && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin || '')) {
    return origin
  }
  return null
}

async function beginCheckout (req, res, { listKey, rateLimitCollection }) {
  res.setHeader('Cache-Control', 'no-store')
  if (!['GET', 'POST'].includes(req.method)) {
    res.setHeader('Allow', 'GET, POST')
    res.status(405).json({ status: 'invalid', message: 'Method not allowed' })
    return null
  }
  const origin = trustedOrigin(req)
  if (req.method === 'POST') {
    if (!origin) {
      res.status(403).json({ status: 'invalid', message: 'Untrusted request origin' })
      return null
    }
    if (!(req.headers['content-type'] || '').toLowerCase().startsWith('application/json')) {
      res.status(415).json({ status: 'invalid', message: 'JSON required' })
      return null
    }
  }
  const model = global.sflKeystone.lists[listKey].adapter.model
  if (!await allowRequest(req, model, rateLimitCollection)) {
    res.setHeader('Retry-After', '600')
    res.status(429).json({ status: 'invalid', message: 'Too many requests. Please wait ten minutes.' })
    return null
  }
  if (req.method === 'GET') {
    res.status(200).json({ clientToken: await PaymentUtils.generateGatewayClientToken() })
    return null
  }
  return { origin, model }
}

async function verifyCheckboxCaptcha (token, origin) {
  let captcha
  if (process.env.RECAPTCHA_V2_SITE_SECRET) {
    try {
      captcha = await PaymentUtils.validateRecaptchaToken(token, { secretKey: process.env.RECAPTCHA_V2_SITE_SECRET })
    } catch (_) {}
  }
  return Boolean(captcha && captcha.success === true && captcha.hostname === new URL(origin).hostname)
}

async function verifyScoreCaptcha (token) {
  let captcha
  try {
    captcha = await PaymentUtils.validateRecaptchaToken(token)
  } catch (_) {
    return true
  }
  if (captcha && captcha.success === true && typeof captcha.score === 'number' && captcha.score <= 0.5) {
    return false
  }
  return true
}

function describeSaleFailure (result = {}) {
  const transaction = result.transaction || {}
  const status = transaction.status
  const processorText = transaction.processorResponseText
  const processorCode = transaction.processorResponseCode
  const gatewayMessage = typeof result.message === 'string' ? result.message.trim() : ''
  let validation = ''
  try {
    const errors = result.errors && typeof result.errors.deepErrors === 'function'
      ? result.errors.deepErrors()
      : []
    validation = errors.map(error => error.message).filter(Boolean).join('; ')
  } catch (_) {}

  if (status === 'gateway_rejected') {
    return [
      'Your payment was rejected by the payment gateway.',
      processorText || gatewayMessage,
      processorCode ? `(code ${processorCode})` : '',
      'Your card was not charged.'
    ].filter(Boolean).join(' ')
  }
  if (status === 'processor_declined') {
    return [
      'Your bank declined the transaction.',
      processorText || gatewayMessage,
      processorCode ? `(code ${processorCode})` : '',
      'Your card was not charged.'
    ].filter(Boolean).join(' ')
  }
  if (validation) return `Payment failed: ${validation}`
  if (gatewayMessage && status) return `Payment failed (${status}): ${gatewayMessage}`
  if (gatewayMessage) return `Payment failed: ${gatewayMessage}`
  if (status) return `Payment failed: ${status}`
  return 'Payment was not accepted. Please check your card details before trying again.'
}

async function settleSale ({ amount, paymentMethodNonce, orderId, streetAddress }) {
  const billingStreetAddress = requireStreetAddress(streetAddress)
  let result
  try {
    result = await PaymentUtils.createSale({
      amount,
      paymentMethodNonce,
      orderId,
      billing: { streetAddress: billingStreetAddress },
      options: { submitForSettlement: true }
    })
  } catch (error) {
    throw new Error(error && error.message ? `Payment gateway error: ${error.message}` : 'Payment gateway error')
  }
  if (result && result.success === false) {
    return { declined: true, message: describeSaleFailure(result) }
  }
  if (!result || result.success !== true || !result.transaction || !result.transaction.id ||
      !SETTLED.includes(result.transaction.status)) {
    const status = result && result.transaction && result.transaction.status
    throw new Error(status ? `Unexpected payment status: ${status}` : 'Unknown payment outcome')
  }
  return { transactionId: result.transaction.id }
}

function needsReviewResponse (res, reference) {
  return res.status(503).json({
    status: 'needsReview',
    reference,
    message: 'Payment outcome needs review. Do not submit another payment; contact South Florida Ultimate with this reference.'
  })
}

function formatEasternDate (value) {
  return new Date(value).toLocaleDateString('en-US', {
    timeZone: 'America/New_York', year: 'numeric', month: 'short', day: 'numeric'
  })
}

async function sendConfirmationEmail ({ to, subject, paragraphs = [], badge, heading, intro, introHtml, highlight, rows }) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) throw new Error('Email unavailable')
  const transport = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000
  })
  const { html, text } = buildBrandedEmail({
    badge,
    heading,
    intro,
    introHtml,
    highlight,
    rows,
    paragraphs
  })
  const result = await transport.sendMail({
    from: 'South Florida Ultimate <sflultimate@gmail.com>',
    replyTo: 'sflultimate@gmail.com',
    to,
    subject,
    text,
    html
  })
  if (!result.accepted || !result.accepted.length) throw new Error('Email not accepted')
}

async function deliverConfirmation ({ send, update }) {
  let emailStatus = 'sent'
  try {
    await send()
  } catch (_) {
    emailStatus = 'failed'
  }
  try {
    await update({
      confirmationEmailStatus: emailStatus,
      ...(emailStatus === 'sent' ? { confirmationEmailSentAt: new Date().toISOString() } : {})
    })
  } catch (_) {
    emailStatus = 'pending'
  }
  return emailStatus
}

module.exports = {
  sanitizeText,
  requireEmail,
  requireRequestId,
  requireStreetAddress,
  beginCheckout,
  verifyCheckboxCaptcha,
  verifyScoreCaptcha,
  settleSale,
  needsReviewResponse,
  formatEasternDate,
  sendConfirmationEmail,
  deliverConfirmation
}
