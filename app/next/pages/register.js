import { gql } from '@apollo/client'
import GraphqlClient from './../lib/graphql-client'
import { addLeagueToVariables } from '../lib/utils'
import LeagueUtils from '../lib/league-utils'
import { HeaderNavigation } from '../components/Navigation'
import Head from 'next/head'
import {updateWithGlobalServerSideProps} from "../lib/global-server-side-props";
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
  
  const activeLeagues = results.data.allLeagues.map(league => {
    LeagueUtils.addLeagueStatus(league, context)
    return league
  })
  
  const props = { activeLeagues }
  
  await updateWithGlobalServerSideProps(props, {})
  return { props: props }
}

export default function LeagueRegisterPage (props) {
  const {activeLeagues, leagues} = props
  return (
    <div>
      <Head>
        <title>{'Register now SFLUltimate leagues'}</title>
        <meta property="og:title" content={'Register now for SFL Ultimate leagues'}/>
        <meta property="og:url" content={'https://www.sflultimate.com/register'}/>
        <meta property="og:description" content={'Find here a list of active leagues for you to play or be a sub at.'}/>
        <style>{`
        .league-logo {
            border: 1px solid #cfcfcf;
            border-radius: 8px;
            box-shadow: 1px 1px 4px #e3e3e3;
            margin-bottom: 1rem;
        }`}</style>
      </Head>
      <HeaderNavigation leagues={leagues} />
      <div className="container">
        {
          activeLeagues.length > 1 && (
            <>
              <h1>Pick Your League</h1>
              <p className="lead">We now offer multiple types of leagues.</p>
            </>
          )
        }

        <div className="row">
          {
            activeLeagues.map(function (league) {
              const route = league.canRegister ? 'register' : 'substitutions'
              const href = `/leagues/${league.slug}/${route}`
              return (
                <div key={league.id} className="col-md-6">
                  <h2>{league.title.replace('Fall League 2025 -', '')}</h2>
                  {
                    league.registrationShareImage && (
                      <a href={href}>
                        <img className="img-responsive league-logo" src={league.registrationShareImage.publicUrl} alt={league.title + ' thumbnail'} />
                      </a>
                    )
                  }
                  <p>
                    {league.summary}
                  </p>
                  <a href={href} className="btn btn-primary btn-block">{league.canRegister ? "Sign Up": "Play a Game as a Sub"}</a>
                </div>
              )
            })
          }
        </div>
      </div>
    </div>
  )
}
