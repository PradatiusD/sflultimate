import GraphqlClient from '../../lib/graphql-client'
import { addLeagueStatus } from '../../lib/payment-utils'
const nodemailer = require('nodemailer')
const { gql } = require('@apollo/client')
const GraphQlClient = require('./../../lib/graphql-client')
const PaymentUtils = require('./../../lib/payment-utils')

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
})

const CREATE_PLAYER_MUTATION = gql`
  mutation CreatePlayer($data: PlayerCreateInput!) {
    createPlayer(data: $data) {
      id
      email
    }
  }
`

/**
 *
 * @param {object} payload
 * @param {number} amount
 * @return {Promise<unknown>}
 */
async function processPayment (payload, amount) {
  const purchase = {
    amount: amount,
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
      skillLevel: payload.skillLevel,
      participation: payload.participation
    }
  }

  const paymentResult = await PaymentUtils.createSale(purchase)

  if (!paymentResult.success) {
    console.error({ purchase, paymentResult })
    throw new Error('Payment failed')
  }

  return paymentResult
}

function createPlayerRecord (payload) {
  const mutationData = {
    createdAt: new Date(),
    updatedAt: new Date(),
    firstName: payload.firstName,
    lastName: payload.lastName,
    gender: payload.gender,
    email: payload.email,
    age: payload.age,
    skillLevel: payload.skillLevel,
    registrationLevel: payload.registrationLevel,
    participation: payload.participation,
    comments: payload.comments,
    phoneNumber: payload.phoneNumber,
    partnerName: payload.partnerName,
    shirtSize: payload.shirtSize,
    wouldSponsor: payload.wouldSponsor,
    willAttendFinals: payload.willAttendFinals,
    wouldCaptain: payload.wouldCaptain,
    leagues: {
      connect: [{ id: payload.leagueId }]
    }
  }

  return GraphQlClient.mutate({
    mutation: CREATE_PLAYER_MUTATION,
    variables: {
      data: mutationData
    }
  })
}

function SendEmail (payload, league) {
  const emailSendParams = {
    from: 'South Florida Ultimate" <sflultimate@gmail.com>',
    to: payload.email,
    subject: 'Registration Confirmation for ' + league.title,
    html: `
            <p>Thank you for your payment!</p>
            <p>Below you can find a receipt for your registration for ${league.title}.</p>
            <table style="border: 1px solid #dadada; padding: 4px;">
              <thead>
                <tr>
                  <th>Field</th>
                  <th>Your Submission</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>First Name</td><td>${payload.firstName}</td></tr>
                <tr><td>Last Name</td><td>${payload.lastName}</td></tr>
                <tr><td>Registration Level</td><td>${payload.registrationLevel}</td></tr>
                <tr><td>Amount Paid</td><td>$${payload.amount}</td></tr>
                <tr><td>Gender</td><td>${payload.gender}</td></tr>
                <tr><td>Participation</td><td>${payload.participation}</td></tr>
                <tr><td>Comments</td><td>${payload.comments}</td></tr>
                <tr><td>Email</td><td>${payload.email}</td></tr>
                <tr><td>Phone Number</td><td>${payload.phoneNumber}</td></tr>
                <tr><td>Age</td><td>${payload.age}</td></tr>
                <tr><td>Wanted to Captain</td><td>${payload.wouldCaptain ? 'Yes' : 'No'}</td></tr>
                <tr><td>Partner's Name</td><td>${payload.partnerName}</td></tr>
                <tr><td>Self-described skill level</td><td>${payload.skillLevel}</td></tr>
                <tr><td>Shirt Size</td><td>${payload.shirtSize}</td></tr>
              </tbody>
            </table>
            <p><em>Organized by South Florida Ultimate Inc., a local non-for-profit and social recreational club organized for the exclusive purposes of <strong>playing</strong>, <strong>promoting</strong>, and <strong>enjoying</strong> the sport known as Ultimate or Ultimate Frisbee.</em></p>
            <p>Follow us on:</p>
            <ul>
                <li><a href="https://instagram.com/sflultimate">Instagram</a></li>
                <li><a href="https://www.facebook.com/sflultimate">Facebook</a></li>
                <li><a href="https://www.tiktok.com/@sflultimate">TikTok</a></li>
                <li><a href="https://chat.whatsapp.com/FZC77g5Tzsw8xwxMXG997V">WhatsApp</a></li>
            </ul>
          `
  }

  return transporter.sendMail(emailSendParams)
}

export default async function handler (req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
    return res
  }

  try {
    const recaptchaResponse = await PaymentUtils.validateRecaptchaToken(req.body.recaptchaToken)
    if (recaptchaResponse && recaptchaResponse.success && recaptchaResponse.score <= 0.5) {
      throw new Error('Unauthorized transaction, we believe you are a bot.  Please contact sflultimate@gmail.com.')
    }

    const results = await GraphqlClient.query({
      query: gql`
        query {
          allLeagues(where: {isActive: true}) {
            title
            pricingEarlyAdult
            pricingEarlyStudent
            pricingRegularAdult
            pricingRegularStudent
            pricingLateAdult
            pricingLateStudent
            earlyRegistrationStart
            earlyRegistrationEnd
            registrationStart
            registrationEnd
            lateRegistrationStart
            lateRegistrationEnd
          }
        }`
    })
    const league = JSON.parse(JSON.stringify(results.data.allLeagues[0]))
    addLeagueStatus(league)

    const sanitizedPayload = {
      paymentMethodNonce: req.body.paymentMethodNonce,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      gender: req.body.gender,
      email: req.body.email,
      age: parseInt(req.body.age),
      skillLevel: parseInt(req.body.skillLevel),
      registrationLevel: req.body.registrationLevel,
      streetAddress: req.body.streetAddress,
      participation: parseInt(req.body.participation),
      comments: req.body.comments,
      phoneNumber: req.body.phoneNumber,
      partnerName: req.body.partnerName,
      shirtSize: req.body.shirtSize,
      wouldSponsor: req.body.wouldSponsor === 'on',
      wouldCaptain: req.body.wouldCaptain === 'on',
      willAttendFinals: req.body.willAttendFinals === 'on',
      leagueId: req.body.league
    }

    if (Array.isArray(req.body.preferredPositions)) {
      sanitizedPayload.preferredPositions = req.body.preferredPositions
    } else if (typeof req.body.preferredPositions === 'string') {
      sanitizedPayload.preferredPositions = [req.body.preferredPositions]
    } else {
      sanitizedPayload.preferredPositions = []
    }

    let amount = 0
    const registrationLevel = sanitizedPayload.registrationLevel
    if (league.isEarlyRegistrationPeriod) {
      amount = registrationLevel === 'Student' ? league.pricingEarlyStudent : league.pricingEarlyAdult
    } else if (league.isRegistrationPeriod) {
      amount = registrationLevel === 'Student' ? league.pricingRegularStudent : league.pricingRegularAdult
    } else if (league.isLateRegistrationPeriod) {
      amount = registrationLevel === 'Student' ? league.pricingLateStudent : league.pricingLateAdult
    }

    const paymentResult = await processPayment(sanitizedPayload, amount)
    const dbCreateResult = await createPlayerRecord(sanitizedPayload)
    const emailResult = await SendEmail({ ...sanitizedPayload, amount }, league)
    if (process.env.NODE_ENV === 'development') {
      console.log(paymentResult)
      console.log(dbCreateResult)
      console.log(emailResult)
      // res.status(200).json({ message: 'Success', data: { paymentResult, dbCreateResult, emailResult } })
    }
    res.redirect('/confirmation?id=' + dbCreateResult.data.createPlayer.id)
  } catch (e) {
    console.error(e)
    res.redirect('/register?error=' + encodeURIComponent(e.message))
  }
}
