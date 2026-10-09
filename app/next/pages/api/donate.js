import { gql } from '@apollo/client'
import GraphqlClient from '../../lib/server-graphql-client'
import { notify } from '../../lib/slack'
import {
  sanitizeText,
  requireEmail,
  requireRequestId,
  requireStreetAddress,
  beginCheckout,
  verifyCheckboxCaptcha,
  settleSale,
  needsReviewResponse,
  formatEasternDate,
  sendConfirmationEmail,
  deliverConfirmation
} from '../../lib/checkout-utils'

export const config = { api: { bodyParser: { sizeLimit: '12kb' } } }

const DONATION_CATEGORIES = ['Youth', 'Hatter 4 Hope', 'Beginner Pick Up', 'No Category']

function validateDonation (body = {}) {
  if (typeof body.amount !== 'string' || !/^\d{1,3}(\.\d{1,2})?$/.test(body.amount)) {
    throw new Error('Invalid amount')
  }
  const [dollars, fraction = ''] = body.amount.split('.')
  const amount = Number(dollars) * 100 + Number(fraction.padEnd(2, '0'))
  if (amount < 500 || amount > 25000) throw new Error('Invalid amount')
  const text = (value, maximum, required, multiline) => sanitizeText(value, maximum, {
    required,
    multiline,
    message: 'Invalid donation details'
  })
  const category = text(body.category, 50)
  if (category && !DONATION_CATEGORIES.includes(category)) throw new Error('Invalid donation category')
  return {
    amount,
    from: text(body.from, 100) || 'Anonymous',
    category: category || null,
    email: requireEmail(body.email),
    message: text(body.message, 1000, false, true),
    requestId: requireRequestId(body.requestId),
    streetAddress: requireStreetAddress(body.streetAddress),
    paymentMethodNonce: text(body.paymentMethodNonce, 2048, true),
    recaptchaToken: text(body.recaptchaToken, 4096, true)
  }
}

async function findDonation (requestId) {
  const result = await GraphqlClient.query({
    query: gql`
      query($requestId: String!) {
        allDonations(where: { requestId: $requestId }, first: 1) {
          id amount from category email message status confirmationEmailStatus
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
  if (input && ['amount', 'from', 'category', 'email', 'message'].some(key => record[key] !== input[key])) {
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

function sendConfirmation (record) {
  return sendConfirmationEmail({
    to: record.email,
    subject: 'Thank you for your donation to South Florida Ultimate',
    badge: 'Donation received',
    heading: 'Thank you!',
    intro: record.from === 'Anonymous' ? 'Hi there,' : `Hi ${record.from},`,
    highlight: { label: 'Donation total', value: `$${(record.amount / 100).toFixed(2)}` },
    rows: [
      { label: 'Date', value: formatEasternDate(record.createdAt) },
      ...(record.category ? [{ label: 'Category', value: record.category }] : []),
      { label: 'Reference', value: record.id }
    ],
    paragraphs: [
      'Thank you for supporting ultimate in South Florida. Your one-time donation was successfully submitted for processing.',
      'Your support helps us welcome more people into the game and grow our local ultimate community.',
      'Questions about your donation? Reply to this email.',
      'Thank you,\nSouth Florida Ultimate'
    ]
  })
}

export default async function handler (req, res) {
  try {
    const checkout = await beginCheckout(req, res, {
      listKey: 'Donation',
      rateLimitCollection: 'donation_rate_limits'
    })
    if (!checkout) return

    let input
    try {
      input = validateDonation(req.body)
    } catch (_) {
      return res.status(400).json({ status: 'invalid', message: 'Provide valid donation details and an amount from $5 to $250 USD.' })
    }
    const existing = await findDonation(input.requestId)
    if (existing) return donationResponse(res, existing, input)

    if (!await verifyCheckboxCaptcha(input.recaptchaToken, checkout.origin)) {
      return res.status(400).json({ status: 'invalid', message: 'Please complete the security check again.' })
    }

    await checkout.model.collection.createIndex({ requestId: 1 }, { unique: true })
    const { paymentMethodNonce, recaptchaToken, streetAddress, ...details } = input
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
      const duplicate = await findDonation(input.requestId)
      if (duplicate) return donationResponse(res, duplicate, input)
      throw error
    }

    try {
      const sale = await settleSale({
        amount: (record.amount / 100).toFixed(2),
        paymentMethodNonce,
        orderId: record.id,
        streetAddress
      })
      if (sale.declined) {
        await updateDonation(record.id, { status: 'failed' })
        notify(`Donation payment declined [ref ${record.id}]: ${sale.message || 'Payment was not accepted.'}`)
        return donationResponse(res, { ...record, status: 'failed' })
      }
      await updateDonation(record.id, { status: 'submitted', transactionId: sale.transactionId })
      record.status = 'submitted'
    } catch (error) {
      try {
        await updateDonation(record.id, { status: 'needsReview' })
      } catch (_) {}
      notify(`Donation payment needs review [ref ${record.id}]: ${error && error.message ? error.message : 'unknown payment outcome'}`)
      return needsReviewResponse(res, record.id)
    }

    const emailStatus = await deliverConfirmation({
      send: () => sendConfirmation(record),
      update: data => updateDonation(record.id, data)
    })
    if (process.env.NODE_ENV !== 'development') {
      notify(`New donation: ${record.from} (${record.email}) — $${(record.amount / 100).toFixed(2)}${record.category ? ` — Category: ${record.category}` : ''} [ref ${record.id}]`)
    }
    return donationResponse(res, { ...record, confirmationEmailStatus: emailStatus })
  } catch (error) {
    notify(`Error processing donation: ${error && error.message ? error.message : 'unknown error'}\n${error && error.stack ? error.stack : ''}`)
    return res.status(503).json({
      status: 'pending',
      message: 'Donation service unavailable. Keep your request ID; do not submit another payment if one may already be processing.'
    })
  }
}
