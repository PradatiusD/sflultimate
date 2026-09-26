import { gql } from '@apollo/client'
import GraphqlClient from '../../lib/server-graphql-client'
import { notify } from '../../lib/slack'
import { createSubscriber } from '../../lib/mailerlite'
import {
  sanitizeText,
  requireEmail,
  requireRequestId,
  requireStreetAddress,
  beginCheckout,
  verifyScoreCaptcha,
  settleSale,
  formatEasternDate,
  sendConfirmationEmail,
  deliverConfirmation
} from '../../lib/checkout-utils'

export const config = { api: { bodyParser: { sizeLimit: '12kb' } } }

function validateInput (body = {}, event) {
  const text = (value, maximum, required, multiline) => sanitizeText(value, maximum, {
    required,
    multiline,
    message: 'Invalid registration details'
  })
  const amountPaid = Number.isInteger(event.registrationPrice) && event.registrationPrice > 0
    ? event.registrationPrice
    : 0
  return {
    name: text(body.name, 100, true),
    email: requireEmail(body.email),
    comments: text(body.comments, 1000, false, true),
    requestId: requireRequestId(body.requestId),
    amountPaid,
    eventId: event.id,
    streetAddress: amountPaid > 0 ? requireStreetAddress(body.streetAddress) : '',
    paymentMethodNonce: amountPaid > 0 ? text(body.paymentMethodNonce, 2048, true) : '',
    recaptchaToken: text(body.recaptchaToken, 4096, true)
  }
}

async function findRegistration (requestId) {
  const result = await GraphqlClient.query({
    query: gql`
      query($requestId: String!) {
        allEventRegistrations(where: { requestId: $requestId }, first: 1) {
          id amountPaid name email comments status
        }
      }
    `,
    variables: { requestId }
  })
  return result.data.allEventRegistrations[0]
}

async function updateRegistration (id, data) {
  await GraphqlClient.mutate({
    mutation: gql`
      mutation($id: ID!, $data: EventRegistrationUpdateInput!) {
        updateEventRegistration(id: $id, data: $data) { id }
      }
    `,
    variables: { id, data }
  })
}

function registrationResponse (res, record, input) {
  if (input && ['amountPaid', 'name', 'email'].some(key => record[key] !== input[key])) {
    return res.status(409).json({ status: 'invalid', message: 'This request ID belongs to different registration details.' })
  }
  if (input && (record.comments || '') !== (input.comments || '')) {
    return res.status(409).json({ status: 'invalid', message: 'This request ID belongs to different registration details.' })
  }
  if (record.status === 'submitted') {
    return res.status(200).json({
      status: 'submitted',
      reference: record.id,
      amountPaid: record.amountPaid,
      emailStatus: record.confirmationEmailStatus
    })
  }
  return res.status(409).json({
    status: record.status,
    reference: record.id,
    message: record.status === 'failed'
      ? 'Payment was not accepted. Please check your card details before trying again.'
      : 'Registration status needs review. Do not submit another payment; contact South Florida Ultimate with this reference.'
  })
}

async function loadEvent (eventId) {
  if (typeof eventId !== 'string' || !eventId.trim()) throw new Error('Invalid event')
  const result = await GraphqlClient.query({
    query: gql`
      query($id: ID!) {
        Event(where: { id: $id }) {
          id name allowRegistrations registrationPrice
        }
      }
    `,
    variables: { id: eventId }
  })
  const event = result.data.Event
  if (!event || !event.allowRegistrations) throw new Error('Registrations are not open for this event')
  return event
}

function sendConfirmation (record) {
  const paid = record.amountPaid > 0
  return sendConfirmationEmail({
    to: record.email,
    subject: `Registration confirmation for ${record.eventName}`,
    badge: 'Registration confirmed',
    heading: "You're registered!",
    intro: `Hi ${record.name}. You are registered for ${record.eventName}.`,
    highlight: {
      label: paid ? 'Order total' : 'Registration',
      value: paid ? `$${Number(record.amountPaid).toFixed(2)}` : 'Free'
    },
    rows: [
      { label: 'Date', value: formatEasternDate(record.createdAt) },
      { label: 'Reference', value: record.id }
    ],
    paragraphs: [
      paid
        ? `Your registration payment of $${Number(record.amountPaid).toFixed(2)} USD was successfully submitted for processing.`
        : 'Your free registration was received.',
      'Questions about your registration? Reply to this email.',
      'Thank you,\nSouth Florida Ultimate'
    ]
  })
}

async function finishSubmitted (res, record, event) {
  createSubscriber({ email: record.email, name: record.name }).catch(error => {
    console.error('MailerLite subscriber creation failed:', error.message)
  })
  const emailStatus = await deliverConfirmation({
    send: () => sendConfirmation({ ...record, eventName: event.name }),
    update: data => updateRegistration(record.id, data)
  })
  if (process.env.NODE_ENV !== 'development') {
    const amount = record.amountPaid > 0
      ? `$${Number(record.amountPaid).toFixed(2)}`
      : 'Free'
    notify(`New event registration for ${event.name}: ${record.name} (${record.email}) — ${amount} [ref ${record.id}]`)
  }
  return registrationResponse(res, { ...record, confirmationEmailStatus: emailStatus })
}

export default async function handler (req, res) {
  try {
    const checkout = await beginCheckout(req, res, {
      listKey: 'EventRegistration',
      rateLimitCollection: 'event_registration_rate_limits'
    })
    if (!checkout) return

    let event
    try {
      event = await loadEvent(req.body.eventId)
    } catch (_) {
      return res.status(400).json({ status: 'invalid', message: 'Registrations are not open for this event.' })
    }

    let input
    try {
      input = validateInput(req.body, event)
    } catch (_) {
      return res.status(400).json({ status: 'invalid', message: 'Provide a valid name, email, and registration details.' })
    }

    const existing = await findRegistration(input.requestId)
    if (existing) return registrationResponse(res, existing, input)

    if (!await verifyScoreCaptcha(input.recaptchaToken)) {
      return res.status(400).json({ status: 'invalid', message: 'Please complete the security check again.' })
    }

    await checkout.model.collection.createIndex({ requestId: 1 }, { unique: true })
    const { paymentMethodNonce, eventId, amountPaid, name, email, comments, requestId, streetAddress } = input
    const initialStatus = amountPaid === 0 ? 'submitted' : 'pending'
    let record
    try {
      const created = await GraphqlClient.mutate({
        mutation: gql`
          mutation($data: EventRegistrationCreateInput!) {
            createEventRegistration(data: $data) { id createdAt }
          }
        `,
        variables: {
          data: {
            name,
            email,
            comments,
            amountPaid,
            requestId,
            event: { connect: { id: eventId } },
            createdAt: new Date().toISOString(),
            status: initialStatus
          }
        }
      })
      record = { name, email, comments, amountPaid, requestId, ...created.data.createEventRegistration, status: initialStatus }
    } catch (error) {
      const duplicate = await findRegistration(input.requestId)
      if (duplicate) return registrationResponse(res, duplicate, input)
      throw error
    }

    if (record.amountPaid === 0) {
      return finishSubmitted(res, record, event)
    }

    try {
      const sale = await settleSale({
        amount: Number(record.amountPaid).toFixed(2),
        paymentMethodNonce,
        orderId: record.id,
        streetAddress
      })
      if (sale.declined) {
        await updateRegistration(record.id, { status: 'failed' })
        notify(`Event registration payment declined for ${event.name} [ref ${record.id}]: ${sale.message || 'Payment was not accepted.'}`)
        return res.status(409).json({
          status: 'failed',
          reference: record.id,
          message: sale.message
        })
      }
      await updateRegistration(record.id, { status: 'submitted', transactionId: sale.transactionId })
      record.status = 'submitted'
    } catch (error) {
      try {
        await updateRegistration(record.id, { status: 'needsReview' })
      } catch (_) {}
      const detail = error && error.message
      notify(`Event registration payment needs review for ${event.name} [ref ${record.id}]: ${detail || 'unknown payment outcome'}`)
      return res.status(503).json({
        status: 'needsReview',
        reference: record.id,
        message: detail
          ? `Payment outcome needs review (${detail}). Do not submit another payment; contact South Florida Ultimate with this reference.`
          : 'Payment outcome needs review. Do not submit another payment; contact South Florida Ultimate with this reference.'
      })
    }

    return finishSubmitted(res, record, event)
  } catch (error) {
    notify(`Error processing event registration: ${error && error.message ? error.message : 'unknown error'}\n${error && error.stack ? error.stack : ''}`)
    return res.status(503).json({
      status: 'pending',
      message: 'Registration is temporarily unavailable. Keep your request ID; do not submit another payment if one may already be processing.'
    })
  }
}
