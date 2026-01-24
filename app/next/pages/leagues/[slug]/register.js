import { gql } from '@apollo/client'
import Head from 'next/head'
import GraphqlClient from '../../../lib/graphql-client'
import { generateGatewayClientToken } from '../../../lib/payment-utils'
import { addLeagueToVariables } from '../../../lib/utils'
import LeagueUtils from '../../../lib/league-utils'
import RegisterPage from '../../../components/Register'
import {updateWithGlobalServerSideProps} from "../../../lib/global-server-side-props";
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

  let braintreeToken = null
  try {
    braintreeToken = await generateGatewayClientToken()
  } catch (e) {
    console.error(e)
  }
  const query = context.req.query
  const players = results.data.allPlayers
  const props = {
    league,
    braintreeToken,
    query,
    players,
    postUrl: '/apis/register'
  }
  await updateWithGlobalServerSideProps(props, context)
  return {
    props
  }
}

export default function LeagueRegisterPage (props) {
  const { league: activeLeague } = props
  return (
    <>
      <Head>
        <title>{'Register now for the SFL Ultimate ' + activeLeague.title}</title>
        <meta name="description" content={activeLeague.summary || ''}/>
        <meta property="og:title" content={'Register now for the SFL Ultimate ' + activeLeague.title}/>
        <meta property="og:url" content={'https://www.sflultimate.com/leagues/' + activeLeague.slug + '/register'}/>
        <meta property="og:description" content={activeLeague.summary || ''}/>
        {
          activeLeague.registrationShareImage && activeLeague.registrationShareImage.publicUrl && (
            <meta property="og:image" content={activeLeague.registrationShareImage.publicUrl}/>
          )
        }
      </Head>
      <RegisterPage {...props} />
    </>
  )
}
