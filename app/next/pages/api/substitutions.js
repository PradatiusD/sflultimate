import { gql } from '@apollo/client'
import PaymentUtils from '../../lib/payment-utils'
import LeagueUtils from '../../lib/league-utils'
import { processPayment, SendEmail } from './utils'
import GraphQlClient from '../../lib/graphql-client'

const CREATE_PLAYER_SUBSTITUTION = gql`
  mutation CreatePlayerSubstitution($data: PlayerSubstitutionCreateInput!) {
    createPlayerSubstitution(data: $data) {
      id
      email
    }
  }
`

function createSubstitutionRecord (payload) {
  const mutationData = {
    createdAt: new Date(),
    updatedAt: new Date(),
    firstName: payload.firstName,
    lastName: payload.lastName,
    name: payload.firstName + ' ' + payload.lastName,
    gender: payload.gender,
    email: payload.email,
    comments: payload.comments,
    league: { connect: { id: payload.leagueId } },
    phoneNumber: payload.phoneNumber
  }

  console.log('Creating player substitution with data:', mutationData.leagues)

  return GraphQlClient.mutate({
    mutation: CREATE_PLAYER_SUBSTITUTION,
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

    const results = await GraphQlClient.query({
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

    let amount = 10

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

    if (disablePayment) {
      amount = 0
      sanitizedPayload.donationAmount = donationAmount
      sanitizedPayload.compedRegistration = true
    }

    const paymentResult = disablePayment ? null : await processPayment(sanitizedPayload, amount)
    const dbCreateResult = await createSubstitutionRecord(sanitizedPayload)
    const emailResult = await SendEmail({ ...sanitizedPayload, amount }, league)
    if (process.env.NODE_ENV === 'development') {
      console.log(paymentResult)
      console.log(dbCreateResult)
      console.log(emailResult)
      // res.status(200).json({ message: 'Success', data: { paymentResult, dbCreateResult, emailResult } })
    }

    res.redirect('/confirmation?id=' + dbCreateResult.data.createPlayerSubstitution.id + '&leagueId=' + sanitizedPayload.leagueId)
  } catch (e) {
    console.error(e)
    console.log(JSON.stringify(e))
    res.redirect('/leagues/' + league.slug + '/substitutions?error=' + encodeURIComponent(e.message))
  }
}
