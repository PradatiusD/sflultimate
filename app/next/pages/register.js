import { gql } from '@apollo/client'
import GraphqlClient from './../lib/graphql-client'
import { addLeagueToVariables } from './../lib/utils'
import { HeaderNavigation } from '../components/Navigation'
import Head from 'next/head'
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

  return { props: { leagues: results.data.allLeagues } }
}

export default function LeagueRegisterPage (props) {
  const activeLeague = props.leagues[0]
  return (
    <div>
      <Head>
        <title>{'Register now for the SFL Ultimate Fall League'}</title>
        <meta property="og:title" content={'Register now for the SFL Ultimate Fall League'}/>
        <meta property="og:url" content={'https://www.sflultimate.com/register'}/>
        <meta property="og:description" content={'Come enjoy an entirely new division, with an mixed and open league.'}/>
        <meta property="og:image" content={'https://d137pw2ndt5u9c.cloudfront.net/keystone/68ab30f3e54b7536052f20fe-sflultimate-fall-league-2025-both-divisions.png'}/>
        <style jsx>{`
        .league-logo {
            border: 1px solid #cfcfcf;
            border-radius: 8px;
            box-shadow: 1px 1px 4px #e3e3e3;
            margin-bottom: 1rem;
        }`}</style>
      </Head>
      <HeaderNavigation league={activeLeague} />
      <div className="container">
        <h1>Pick Your League</h1>
        <p className="lead">We now offer multiple types of leagues, all at the same location.</p>
        <div className="row">
          {
            props.leagues.map(function (league) {
              const href = '/leagues/' + league.slug + '/register'
              return (
                <div key={league.id} className="col-md-6">
                  <h2>{league.title}</h2>
                  <a href={href}>
                    <img className="img-responsive league-logo" src={league.registrationShareImage.publicUrl} alt={league.title + ' thumbnail'} />
                  </a>
                  <p>
                    {league.summary}
                  </p>
                  <a href={href} className="btn btn-primary btn-block">Sign Up</a>
                </div>
              )
            })
          }
        </div>
      </div>
    </div>
  )
}
