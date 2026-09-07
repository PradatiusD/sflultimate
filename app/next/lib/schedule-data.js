import { gql } from '@apollo/client'
import GraphqlClient from './server-graphql-client'
import LeagueUtils from './league-utils'
import { addLeagueToVariables } from './utils'
import { updateWithGlobalServerSideProps } from './global-server-side-props'

export const getScheduleData = async function (context) {
  const variables = addLeagueToVariables(context, {})
  const results = await GraphqlClient.query({
    query: gql`
      query($leagueCriteria: LeagueWhereInput) {
        allLeagues(where: $leagueCriteria) {
          id
          title
          slug
          earlyRegistrationStart
          earlyRegistrationEnd
          registrationStart
          registrationEnd
          lateRegistrationStart
          lateRegistrationEnd
          finalsTournamentDescription
          finalsTournamentEndDate
          finalsTournamentStartDate
          finalsTournamentLocation {
            name
          }
        }
        allGames(where: {league: $leagueCriteria}, sortBy: scheduledTime_ASC) {
          id
          name
          showNameOnSchedule
          scheduledTime
          homeTeam {
            id
            name
            slug
            color
          }
          homeTeamScore
          homeTeamForfeit
          awayTeam {
            id
            name
            slug
            color
          }
          awayTeamScore
          awayTeamForfeit
          location {
            name
            mapsLocationUrl
          }
          __typename
        }
        allEvents {
          id
          startTime
          name
          slug
          category
          location
          moreInformationUrl
          image {
            publicUrl
          }
          __typename
        }
        allTeams(where: {league: $leagueCriteria}) {
          id
          color
        }
      }`,
    variables
  })
  const league = results.data.allLeagues[0]
  const games = Array.from(results.data.allGames).sort((a, b) => {
    return new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime()
  })
  const teams = results.data.allTeams
  const events = results.data.allEvents.filter(event => event.startTime && new Date(event.startTime).getTime() > Date.now())
  LeagueUtils.addLeagueStatus(league)
  const props = { league, games, teams, events }
  await updateWithGlobalServerSideProps(props)
  return props
}
