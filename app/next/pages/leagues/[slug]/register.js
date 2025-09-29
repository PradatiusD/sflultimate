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
      }`,
    variables
  })
  const league = JSON.parse(JSON.stringify(results.data.allLeagues[0]))
  LeagueUtils.addLeagueStatus(league, context)
  const token = await generateGatewayClientToken()
  const queryString = context.req.query
  return {
    props: {
      league,
      braintreeToken: token,
      query: queryString
    }
  }
}

export default function LeagueRegisterPage (props) {
  return (
    <RegisterPage {...props} />
  )
}
