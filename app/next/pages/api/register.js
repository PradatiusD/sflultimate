import GraphqlClient from '../../lib/graphql-client'
import LeagueUtils from '../../lib/league-utils'
import { processPayment, SendEmail } from './utils'
import { notify } from '../../lib/slack'
const { gql } = require('@apollo/client')
const GraphQlClient = require('./../../lib/graphql-client')
const PaymentUtils = require('./../../lib/payment-utils')

const FORCED_PAYMENT_AMOUNTS = {
  processor_declined: 2000,
  gateway_rejected: 5001
}

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
  let forcePaymentFailure

  try {
    const recaptchaResponse = await PaymentUtils.validateRecaptchaToken(req.body.recaptchaToken)
    if (recaptchaResponse && recaptchaResponse.success && recaptchaResponse.score <= 0.5) {
      throw new Error('Unauthorized transaction, we believe you are a bot.  Please contact sflultimate@gmail.com.')
    }

    const disablePayment = req.headers.referer.includes('disable_payment=true')
    const referer = new URL(req.headers.referer)
    const requestedPaymentFailure = process.env.NODE_ENV !== 'production' ? referer.searchParams.get('force_payment_failure') : null
    if (requestedPaymentFailure && process.env.BRAINTREE_ENV !== 'Sandbox') {
      throw new Error('Forced payment failures require the Braintree Sandbox environment.')
    }
    if (requestedPaymentFailure && !FORCED_PAYMENT_AMOUNTS[requestedPaymentFailure]) {
      throw new Error('Unsupported forced payment failure.')
    }
    forcePaymentFailure = requestedPaymentFailure

    const results = await GraphqlClient.query({
      query: gql`
        query($leagueId: ID) {
          allLeagues(where: {id: $leagueId}) {
            title
            slug
            pricingEarlyAdult
            pricingEarlyStudent
            pricingEarlyFirstTimePlayer
            pricingRegularAdult
            pricingRegularStudent
            pricingRegularFirstTimePlayer
            pricingLateAdult
            pricingLateStudent
            pricingLateFirstTimePlayer
            jerseyCost
            requestShirtSize
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

    const registrationSelection = req.body.registrationLevel
    const normalizedRegistrationLevel = ['Adult with jersey', 'Adult without jersey'].includes(registrationSelection)
      ? 'Adult'
      : registrationSelection

    const sanitizedPayload = {
      paymentMethodNonce: req.body.paymentMethodNonce,
      firstName: (req.body.firstName || '').trim(),
      lastName: (req.body.lastName || '').trim(),
      gender: req.body.gender,
      email: req.body.email,
      age: parseInt(req.body.age),
      athleticismLevel: parseInt(req.body.athleticismLevel),
      experienceLevel: parseInt(req.body.experienceLevel),
      throwsLevel: parseInt(req.body.throwsLevel),
      registrationLevel: normalizedRegistrationLevel,
      streetAddress: req.body.streetAddress,
      participation: parseInt(req.body.participation),
      comments: req.body.comments,
      phoneNumber: req.body.phoneNumber,
      partnerName: (req.body.partnerName || '').trim(),
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

    let adultRegistrationPrice = 0
    let studentRegistrationPrice = 0
    let firstTimeRegistrationPrice
    if (league.isEarlyRegistrationPeriod) {
      adultRegistrationPrice = league.pricingEarlyAdult
      studentRegistrationPrice = league.pricingEarlyStudent
      firstTimeRegistrationPrice = league.pricingEarlyFirstTimePlayer
    } else if (league.isRegistrationPeriod) {
      adultRegistrationPrice = league.pricingRegularAdult
      studentRegistrationPrice = league.pricingRegularStudent
      firstTimeRegistrationPrice = league.pricingRegularFirstTimePlayer
    } else if (league.isLateRegistrationPeriod) {
      adultRegistrationPrice = league.pricingLateAdult
      studentRegistrationPrice = league.pricingLateStudent
      firstTimeRegistrationPrice = league.pricingLateFirstTimePlayer
    }

    let amount = studentRegistrationPrice
    const registrationLevel = sanitizedPayload.registrationLevel
    const validRegistrationLevels = ['Adult', 'Student', 'First Time Player']
    const validAdultSelections = league.requestShirtSize
      ? ['Adult', 'Adult with jersey', 'Adult without jersey']
      : ['Adult']
    if (!validRegistrationLevels.includes(registrationLevel) || (registrationLevel === 'Adult' && !validAdultSelections.includes(registrationSelection))) {
      throw new Error('Please select a valid registration type.')
    }

    if (registrationLevel === 'Adult') {
      amount = adultRegistrationPrice
    } else if (registrationLevel === 'First Time Player') {
      amount = firstTimeRegistrationPrice ?? studentRegistrationPrice
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

    const validShirtSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
    const adultIncludesJersey = registrationSelection === 'Adult with jersey' ||
      (registrationSelection === 'Adult' && validShirtSizes.includes(sanitizedPayload.shirtSize))

    if (league.requestShirtSize && (registrationLevel !== 'Adult' || adultIncludesJersey) && !validShirtSizes.includes(sanitizedPayload.shirtSize)) {
      throw new Error(registrationLevel === 'Adult'
        ? 'Please select a jersey size.'
        : 'Students and first-time players must select a jersey size.')
    }

    if (league.requestShirtSize && registrationLevel === 'Adult' && !adultIncludesJersey) {
      sanitizedPayload.shirtSize = 'NA'
    }

    if (league.requestShirtSize && registrationLevel === 'Adult' && adultIncludesJersey) {
      amount += league.jerseyCost
    }

    if (disablePayment) {
      amount = 0
      sanitizedPayload.donationAmount = donationAmount
      sanitizedPayload.compedRegistration = true
    }

    // Braintree transaction failures are triggered by amount, not card number, in sandbox.
    if (forcePaymentFailure) {
      amount = FORCED_PAYMENT_AMOUNTS[forcePaymentFailure]
    }

    const paymentResult = disablePayment ? null : await processPayment(sanitizedPayload, amount)
    const dbCreateResult = await createPlayerRecord(sanitizedPayload)
    const emailResult = await SendEmail({ ...sanitizedPayload, amount }, league)
    if (process.env.NODE_ENV === 'development') {
      console.log(paymentResult)
      console.log(dbCreateResult)
      console.log(emailResult)
      // res.status(200).json({ message: 'Success', data: { paymentResult, dbCreateResult, emailResult } })
    } else {
      notify(`New registration for ${league.title}: ${sanitizedPayload.firstName} ${sanitizedPayload.lastName} (${sanitizedPayload.email})`)
    }

    res.redirect(`/confirmation?id=${dbCreateResult.data.createPlayer.id}&leagueId=${sanitizedPayload.leagueId}`)
  } catch (e) {
    console.error(e)
    console.log(JSON.stringify(e))
    if (!forcePaymentFailure) {
      notify(`Error processing registration: ${e.message}\n${e.stack || ''}`)
    }
    const query = new URLSearchParams({ error: e.message })
    if (forcePaymentFailure) {
      query.set('force_form', 'true')
      query.set('force_period', 'regular')
      query.set('force_payment_failure', forcePaymentFailure)
    }
    res.redirect(`/leagues/${league.slug}/register?${query.toString()}`)
  }
}
