import { gql } from '@apollo/client'
import GraphqlClient from '../../../lib/graphql-client'
import { generateGatewayClientToken } from '../../../lib/payment-utils'
import { addLeagueToVariables } from '../../../lib/utils'
import LeagueUtils from '../../../lib/league-utils'
import RegisterPage from '../../../components/Register'
export const getServerSideProps = async (context) => {
  const variables = addLeagueToVariables(context, {})
  const results = await GraphqlClient.query({
    query: gql`
      query($leagueCriteria: LeagueWhereInput) {
        allLeagues(where: $leagueCriteria) {
          id
          title
          slug
          summary
          description
          numberOfWeeksOfPlay
          earlyRegistrationStart
          earlyRegistrationEnd
          registrationStart
          registrationEnd
          lateRegistrationStart
          lateRegistrationEnd
          pricingEarlyAdult
          pricingEarlyStudent
          pricingRegularAdult
          pricingRegularStudent
          pricingLateStudent
          pricingLateAdult
          requestShirtSize
          requestSponsorship
          requestAttendance
          finalsTournamentDescription
          finalsTournamentEndDate
          finalsTournamentStartDate
          registrationShareImage {
            publicUrl
          }
        }
        allPlayers(where: {leagues_some: $leagueCriteria}) {
          gender
        }
      }`,
    variables
  })
  const league = JSON.parse(JSON.stringify(results.data.allLeagues[0]))
  LeagueUtils.addLeagueStatus(league, context)
  league.canRegister = true
  league.pricingEarlyStudent = 10
  league.pricingRegularStudent = 10
  league.pricingLateStudent = 10
  league.pricingEarlyAdult = 10
  league.pricingRegularAdult = 10
  league.pricingLateAdult = 10

  let braintreeToken = null
  try {
    braintreeToken = await generateGatewayClientToken()
  } catch (e) {
    console.error(e)
  }
  const query = context.req.query
  const players = results.data.allPlayers
  return {
    props: {
      league,
      braintreeToken,
      query,
      players,
      postUrl: '/api/substitutions'
    }
  }
}

export default function LeagueSubPage (props) {
  return (
    <RegisterPage {...props} />
  )
}
