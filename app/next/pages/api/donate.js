import { gql } from '@apollo/client'
import { createHash } from 'crypto'
import nodemailer from 'nodemailer'
import GraphqlClient from '../../lib/server-graphql-client'
import PaymentUtils from '../../lib/payment-utils'

export const config = { api: { bodyParser: { sizeLimit: '12kb' } } }

function validateDonation (body = {}) {
  if (typeof body.amount !== 'string' || !/^\d{1,3}(\.\d{1,2})?$/.test(body.amount)) {
    throw new Error('Invalid amount')
  }
  const [dollars, fraction = ''] = body.amount.split('.')
  const amount = Number(dollars) * 100 + Number(fraction.padEnd(2, '0'))
  if (amount < 500 || amount > 25000) throw new Error('Invalid amount')

  function text (value = '', maximum, required = false, multiline = false) {
    if (typeof value !== 'string' || value.length > maximum || (required && !value.trim())) {
      throw new Error('Invalid donation details')
    }
    const hasControlCharacter = Array.from(value).some(character => {
      if (multiline && '\n\r\t'.includes(character)) return false
      return character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127
    })
    if (hasControlCharacter) throw new Error('Invalid donation details')
    return value.trim()
  }

  const email = text(body.email, 254, true)
  if (!/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/i.test(email)) {
    throw new Error('Invalid email')
  }
  if (typeof body.requestId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.requestId)) {
    throw new Error('Invalid request ID')
  }
  return {
    amount,
    from: text(body.from, 100) || 'Anonymous',
    email,
    message: text(body.message, 1000, false, true),
    requestId: body.requestId.toLowerCase(),
    paymentMethodNonce: text(body.paymentMethodNonce, 2048, true),
    recaptchaToken: text(body.recaptchaToken, 4096, true)
  }
}

async function findDonation (requestId) {
  const result = await GraphqlClient.query({
    query: gql`
      query($requestId: String!) {
        allDonations(where: { requestId: $requestId }, first: 1) {
          id amount from email message status confirmationEmailStatus
        }
      }
    `,
    variables: { requestId }
  })
  return result.data.allDonations[0]
}

async function updateDonation (id, data) {
  await GraphqlClient.mutate({
    mutation: gql`
      mutation($id: ID!, $data: DonationUpdateInput!) {
        updateDonation(id: $id, data: $data) { id }
      }
    `,
    variables: { id, data }
  })
}

function donationResponse (res, record, input) {
  if (input && ['amount', 'from', 'email', 'message'].some(key => record[key] !== input[key])) {
    return res.status(409).json({ status: 'invalid', message: 'This request ID belongs to different donation details.' })
  }
  if (record.status === 'submitted') {
    return res.status(200).json({
      status: 'submitted',
      reference: record.id,
      amount: record.amount,
      emailStatus: record.confirmationEmailStatus
    })
  }
  return res.status(409).json({
    status: record.status,
    reference: record.id,
    message: record.status === 'failed'
      ? 'Payment was not accepted. Please check your card details before trying again.'
      : 'Payment status needs review. Do not submit another payment; contact South Florida Ultimate with this reference.'
  })
}

async function sendConfirmation (record) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) throw new Error('Email unavailable')
  const transport = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000
  })
  const date = new Date(record.createdAt).toLocaleDateString('en-US', {
    timeZone: 'America/New_York', year: 'numeric', month: 'short', day: 'numeric'
  })
  const paragraphs = [
    record.from === 'Anonymous' ? 'Hi there,' : `Hi ${record.from},`,
    `Thank you for supporting ultimate in South Florida. Your one-time donation of $${(record.amount / 100).toFixed(2)} USD was successfully submitted for processing.`,
    'Your support helps us welcome more people into the game and grow our local ultimate community.',
    `Date: ${date}`,
    `Reference: ${record.id}`,
    'Questions about your donation? Reply to this email.',
    'Thank you,\nSouth Florida Ultimate'
  ]
  const html = paragraphs.map(paragraph => {
    const escaped = paragraph.replace(/[&<>"']/g, character => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[character]))
    return `<p>${escaped.replace(/\n/g, '<br>')}</p>`
  }).join('')
  const result = await transport.sendMail({
    from: 'South Florida Ultimate <sflultimate@gmail.com>',
    replyTo: 'sflultimate@gmail.com',
    to: record.email,
    subject: 'Thank you for your donation to South Florida Ultimate',
    text: paragraphs.join('\n\n'),
    html
  })
  if (!result.accepted || !result.accepted.length) throw new Error('Email not accepted')
}

async function allowRequest (req, model) {
  // Keystone CRUD has no atomic increment: only the shared throttle uses raw Mongo.
  const limits = model.db.collection('donation_rate_limits')
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
    // Another worker created this window first; increment that counter instead.
    result = await limits.findOneAndUpdate({ _id: key }, update, { returnDocument: 'after' })
  }
  return result.value && result.value.count <= maximum
}

export default async function handler (req, res) {
  res.setHeader('Cache-Control', 'no-store')
  if (!['GET', 'POST'].includes(req.method)) {
    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ status: 'invalid', message: 'Method not allowed' })
  }
  const origin = process.env.DONATION_SITE_ORIGIN
  if (req.method === 'POST') {
    if (!origin || req.headers.origin !== origin) {
      return res.status(403).json({ status: 'invalid', message: 'Untrusted request origin' })
    }
    if (!(req.headers['content-type'] || '').toLowerCase().startsWith('application/json')) {
      return res.status(415).json({ status: 'invalid', message: 'JSON required' })
    }
  }

  try {
    const model = global.sflKeystone.lists.Donation.adapter.model
    if (!await allowRequest(req, model)) {
      res.setHeader('Retry-After', '600')
      return res.status(429).json({ status: 'invalid', message: 'Too many requests. Please wait ten minutes.' })
    }
    if (req.method === 'GET') {
      return res.status(200).json({ clientToken: await PaymentUtils.generateGatewayClientToken() })
    }

    let input
    try {
      input = validateDonation(req.body)
    } catch (_) {
      return res.status(400).json({ status: 'invalid', message: 'Provide valid donation details and an amount from $5 to $250 USD.' })
    }
    const existing = await findDonation(input.requestId)
    if (existing) return donationResponse(res, existing, input)

    let captcha
    if (process.env.RECAPTCHA_V2_SITE_SECRET) {
      try {
        captcha = await PaymentUtils.validateRecaptchaToken(input.recaptchaToken, { secretKey: process.env.RECAPTCHA_V2_SITE_SECRET })
      } catch (_) {
        // Verification failures must never proceed to payment.
      }
    }
    if (!captcha || captcha.success !== true || captcha.hostname !== new URL(origin).hostname) {
      return res.status(400).json({ status: 'invalid', message: 'Please complete the security check again.' })
    }

    // Await the list's unique constraint even when production auto-indexing is disabled.
    await model.collection.createIndex({ requestId: 1 }, { unique: true })
    const { paymentMethodNonce, recaptchaToken, ...details } = input
    let record
    try {
      const created = await GraphqlClient.mutate({
        mutation: gql`
          mutation($data: DonationCreateInput!) {
            createDonation(data: $data) { id createdAt }
          }
        `,
        variables: { data: { ...details, createdAt: new Date().toISOString(), status: 'pending', confirmationEmailStatus: 'pending' } }
      })
      record = { ...details, ...created.data.createDonation, status: 'pending', confirmationEmailStatus: 'pending' }
    } catch (error) {
      // A concurrent request may have won the unique insert. Only its owner can charge.
      const duplicate = await findDonation(input.requestId)
      if (duplicate) return donationResponse(res, duplicate, input)
      throw error
    }

    try {
      const result = await PaymentUtils.createSale({
        amount: (record.amount / 100).toFixed(2),
        paymentMethodNonce,
        orderId: record.id,
        options: { submitForSettlement: true }
      })
      if (result && result.success === false) {
        await updateDonation(record.id, { status: 'failed' })
        return donationResponse(res, { ...record, status: 'failed' })
      }
      if (!result || result.success !== true || !result.transaction || !result.transaction.id ||
          !['submitted_for_settlement', 'settling', 'settled', 'settlement_pending'].includes(result.transaction.status)) {
        throw new Error('Unknown payment outcome')
      }
      await updateDonation(record.id, { status: 'submitted', transactionId: result.transaction.id })
      record.status = 'submitted'
    } catch (_) {
      try {
        await updateDonation(record.id, { status: 'needsReview' })
      } catch (_) {
        // The pending record and Braintree orderId still allow manual reconciliation.
      }
      return res.status(503).json({
        status: 'needsReview',
        reference: record.id,
        message: 'Payment outcome needs review. Do not submit another payment; contact South Florida Ultimate with this reference.'
      })
    }

    let emailStatus = 'sent'
    try {
      await sendConfirmation(record)
    } catch (_) {
      emailStatus = 'failed'
    }
    try {
      await updateDonation(record.id, {
        confirmationEmailStatus: emailStatus,
        ...(emailStatus === 'sent' ? { confirmationEmailSentAt: new Date().toISOString() } : {})
      })
    } catch (_) {
      emailStatus = 'pending'
    }
    return donationResponse(res, { ...record, confirmationEmailStatus: emailStatus })
  } catch (_) {
    return res.status(503).json({
      status: 'pending',
      message: 'Donation service unavailable. Keep your request ID; do not submit another payment if one may already be processing.'
    })
  }
}
