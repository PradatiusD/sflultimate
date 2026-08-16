import { gql } from '@apollo/client'
import GraphqlClient from './../lib/graphql-client'
import { addLeagueToVariables } from '../lib/utils'
import LeagueUtils from '../lib/league-utils'
import { HeaderNavigation } from '../components/Navigation'
import { updateWithGlobalServerSideProps } from '../lib/global-server-side-props'
import SeoHead from '../components/SeoHead'
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
  return { props }
}

export default function LeagueRegisterPage (props) {
  const { activeLeagues, leagues } = props
  return (
    <div>
      <SeoHead
        title="Register now for SFL Ultimate leagues"
        description="Find active South Florida Ultimate leagues that are open for registration or currently seeking substitute players."
        path="/register"
      >
        <style>{`
        .league-logo {
            border: 1px solid #cfcfcf;
            border-radius: 8px;
            box-shadow: 1px 1px 4px #e3e3e3;
            margin-bottom: 1rem;
        }`}</style>
      </SeoHead>
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
                        <img className="img-fluid league-logo" src={league.registrationShareImage.publicUrl} alt={league.title + ' thumbnail'} />
                      </a>
                    )
                  }
                  <p>
                    {league.summary}
                  </p>
                  <a href={href} className="btn btn-primary btn-block">{league.canRegister ? 'Sign Up' : 'Play a Game as a Sub'}</a>
                </div>
              )
            })
          }
        </div>
      </div>
    </div>
  )
}
