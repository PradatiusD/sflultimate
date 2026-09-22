const PaymentUtils = require('./../../lib/payment-utils')
const nodemailer = require('nodemailer')
const { buildBrandedEmail, escapeHtml } = require('./../../lib/email-template')

/**
 *
 * @param {object} payload
 * @param {number} amount
 * @return {Promise<unknown>}
 */
export async function processPayment (payload, amount) {
  if (typeof payload.streetAddress !== 'string' || !payload.streetAddress.trim()) {
    throw new Error('Please enter your street address before submitting payment.')
  }

  const purchase = {
    amount,
    paymentMethodNonce: payload.paymentMethodNonce,
    options: {
      submitForSettlement: true
    },
    customer: {
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email
    },
    billing: {
      streetAddress: payload.streetAddress
    },
    customFields: {
      partner: payload.partnerName,
      gender: payload.gender,
      skillLevel: [payload.athleticismLevel, payload.experienceLevel, payload.throwsLevel].join(', '),
      participation: payload.participation
    }
  }

  const paymentResult = await PaymentUtils.createSale(purchase)

  if (!paymentResult.success) {
    const paymentStatus = paymentResult.transaction && paymentResult.transaction.status
    console.error('Payment failed', {
      status: paymentStatus,
      message: paymentResult.message
    })
    let errorMessage
    if (paymentStatus === 'gateway_rejected') {
      errorMessage = 'Your payment was rejected. Please verify that your street address and ZIP code are correct, or try another payment method.  Your card was not charged.'
    } else if (paymentStatus === 'processor_declined') {
      errorMessage = 'Your transaction was declined by your bank. Please double-check your card details, contact your card issuer, or try another payment method.  Your card was not charged.'
    } else if (paymentResult && paymentResult.message) {
      errorMessage = 'Payment failed'
      errorMessage += ': ' + paymentResult.message
    } else if (paymentStatus) {
      errorMessage = 'Payment failed'
      errorMessage += ': ' + paymentStatus
    } else {
      errorMessage = 'Payment failed'
    }
    throw new Error(errorMessage)
  }

  return paymentResult
}

export function SendEmail (payload, league) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  })

  const jerseyStatus = payload.shirtSize && payload.shirtSize !== 'NA'
    ? `${payload.registrationLevel === 'Adult' ? 'Yes' : 'Included'} (size: ${payload.shirtSize})`
    : 'No'

  const { html, text } = buildBrandedEmail({
    badge: 'Registration confirmed',
    heading: "You're registered!",
    intro: `Thanks, ${payload.firstName}. We received your registration for ${league.title}.`,
    introHtml: `Thanks, ${escapeHtml(payload.firstName)}. We received your registration for <strong>${escapeHtml(league.title)}</strong>.`,
    highlight: { label: 'Order total', value: `$${payload.amount}` },
    rows: [
      { label: 'Name', value: `${payload.firstName} ${payload.lastName}` },
      { label: 'Registration type', value: payload.registrationLevel },
      { label: 'Jersey', value: jerseyStatus },
      { label: 'Gender', value: payload.gender },
      { label: 'Participation', value: payload.participation },
      { label: 'Age', value: payload.age },
      { label: 'Captain interest', value: payload.wouldCaptain ? 'Yes' : 'No' },
      { label: 'Partner', value: payload.partnerName || 'None requested' },
      { label: 'Athleticism level', value: payload.athleticismLevel },
      { label: 'Experience level', value: payload.experienceLevel },
      { label: 'Throws level', value: payload.throwsLevel },
      { label: 'Comments', value: payload.comments || 'None' },
      { label: 'Email', value: payload.email },
      { label: 'Phone Number', value: payload.phoneNumber }
    ]
  })

  return transporter.sendMail({
    from: 'South Florida Ultimate <sflultimate@gmail.com>',
    to: payload.email,
    subject: 'Registration Confirmation for ' + league.title,
    text,
    html
  })
}
