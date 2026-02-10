import GraphqlClient from '../../lib/graphql-client'
import LeagueUtils from '../../lib/league-utils'
import { processPayment, SendEmail } from './utils'
const { gql } = require('@apollo/client')
const GraphQlClient = require('./../../lib/graphql-client')
const PaymentUtils = require('./../../lib/payment-utils')

const CREATE_PLAYER_MUTATION = gql`
  mutation CreatePlayer($data: PlayerCreateInput!) {
    createPlayer(data: $data) {
      id
      email
    }
  }
`

function createPlayerRecord (payload) {
  const mutationData = {
    createdAt: new Date(),
    updatedAt: new Date(),
    name: payload.firstName + ' ' + payload.lastName,
    firstName: payload.firstName,
    lastName: payload.lastName,
    gender: payload.gender,
    email: payload.email,
    age: payload.age,
    athleticismLevel: payload.athleticismLevel,
    experienceLevel: payload.experienceLevel,
    throwsLevel: payload.throwsLevel,
    registrationLevel: payload.registrationLevel,
    preferredPositions: Array.isArray(payload.preferredPositions) ? payload.preferredPositions.join(', ') : '',
    participation: payload.participation,
    comments: payload.comments,
    phoneNumber: payload.phoneNumber,
    partnerName: payload.partnerName,
    shirtSize: payload.shirtSize,
    wouldSponsor: payload.wouldSponsor,
    willAttendFinals: payload.willAttendFinals,
    wouldCaptain: payload.wouldCaptain,
    donationAmount: payload.donationAmount,
    compedRegistration: payload.compedRegistration || false,
    leagues: {
      connect: [{ id: payload.leagueId }]
    }
  }

  console.log('Creating player record with data:', mutationData.leagues)

  return GraphQlClient.mutate({
    mutation: CREATE_PLAYER_MUTATION,
    variables: {
      data: mutationData
    }
  })
}

export default async function handler (req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
    return res
  }

  let league

  try {
    const recaptchaResponse = await PaymentUtils.validateRecaptchaToken(req.body.recaptchaToken)
    if (recaptchaResponse && recaptchaResponse.success && recaptchaResponse.score <= 0.5) {
      throw new Error('Unauthorized transaction, we believe you are a bot.  Please contact sflultimate@gmail.com.')
    }

    const disablePayment = req.headers.referer.includes('disable_payment=true')

    const results = await GraphqlClient.query({
      query: gql`
        query($leagueId: ID) {
          allLeagues(where: {id: $leagueId}) {
            title
            slug
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
        }`,
      variables: {
        leagueId: req.body.leagueId
      }
    })
    league = JSON.parse(JSON.stringify(results.data.allLeagues[0]))
    LeagueUtils.addLeagueStatus(league)

    const sanitizedPayload = {
      paymentMethodNonce: req.body.paymentMethodNonce,
      firstName: req.body.firstName.trim(),
      lastName: req.body.lastName.trim(),
      gender: req.body.gender,
      email: req.body.email,
      age: parseInt(req.body.age),
      athleticismLevel: parseInt(req.body.athleticismLevel),
      experienceLevel: parseInt(req.body.experienceLevel),
      throwsLevel: parseInt(req.body.throwsLevel),
      registrationLevel: req.body.registrationLevel,
      streetAddress: req.body.streetAddress,
      participation: parseInt(req.body.participation),
      comments: req.body.comments,
      phoneNumber: req.body.phoneNumber,
      partnerName: req.body.partnerName.trim(),
      shirtSize: req.body.shirtSize,
      wouldSponsor: req.body.wouldSponsor === 'on',
      wouldCaptain: req.body.wouldCaptain === 'Yes',
      willAttendFinals: req.body.willAttendFinals === 'on',
      leagueId: req.body.leagueId,
      donationLevel: req.body.donationLevel,
      compedRegistration: false
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

    // Donation
    const donationTiers = {
      tier_0: 0,
      tier_1: league.pricingRegularAdult * 0.5,
      tier_2: league.pricingRegularAdult,
      tier_3: league.pricingRegularAdult * 2
    }

    const donationAmount = donationTiers[sanitizedPayload.donationLevel] || 0
    amount += donationAmount
    sanitizedPayload.donationAmount = amount

    if (sanitizedPayload.shirtSize === 'NA') {
      amount -= 15
    }

    if (disablePayment) {
      amount = 0
      sanitizedPayload.donationAmount = donationAmount
      sanitizedPayload.compedRegistration = true
    }

    const paymentResult = disablePayment ? null : await processPayment(sanitizedPayload, amount)
    const dbCreateResult = await createPlayerRecord(sanitizedPayload)
    const emailResult = await SendEmail({ ...sanitizedPayload, amount }, league)
    if (process.env.NODE_ENV === 'development') {
      console.log(paymentResult)
      console.log(dbCreateResult)
      console.log(emailResult)
      // res.status(200).json({ message: 'Success', data: { paymentResult, dbCreateResult, emailResult } })
    }

    res.redirect('/confirmation?id=' + dbCreateResult.data.createPlayer.id + '&leagueId=' + sanitizedPayload.leagueId)
  } catch (e) {
    console.error(e)
    console.log(JSON.stringify(e))
    res.redirect('/leagues/' + league.slug + '/register?error=' + encodeURIComponent(e.message))
  }
}
