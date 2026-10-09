import { gql } from '@apollo/client'
import GraphqlClient from './server-graphql-client'
import LeagueUtils from './league-utils'
import { addLeagueToVariables } from './utils'
import { updateWithGlobalServerSideProps } from './global-server-side-props'

export const getLeagueTeamsData = async (context) => {
  const variables = addLeagueToVariables(context, {})
  const results = await GraphqlClient.query({
    query: gql`
      query($leagueCriteria: LeagueWhereInput) {
        allLeagues(where:$leagueCriteria) {
          title
          slug
          earlyRegistrationStart
          earlyRegistrationEnd
          registrationStart
          registrationEnd
          lateRegistrationStart
          lateRegistrationEnd
          registrationShareImage {
            publicUrl
          }
        }
        allTeams(where: {league: $leagueCriteria}) {
          id,
          name
          slug
          color
          captains {
            id
            gender
            firstName
            lastName
          }
          players(sortBy: [gender_ASC, firstName_ASC, lastName_ASC]) {
            id
            gender
            firstName
            lastName
            profileImage {
              publicUrl
            }
          }
        }
        allPlayers(where: {profileImage_not: null}) {
          firstName
          lastName
          profileImage {
            publicUrl
          }
        }
      }`,
    variables
  })
  const league = results.data.allLeagues[0]
  const teams = results.data.allTeams
  const playersRegistered = await GraphqlClient.query({
    query: gql`
        query($leagueCriteria: LeagueWhereInput) {
          allPlayers(sortBy: [gender_ASC, firstName_ASC, lastName_ASC], where: {leagues_some: $leagueCriteria}) {
            id
            gender
            firstName
            lastName
            profileImage {
              publicUrl
            }
          }
        }`,
    variables
  })
  const profileMap = {}
  for (const player of results.data.allPlayers) {
    profileMap[player.firstName.toLowerCase() + ' ' + player.lastName.toLowerCase()] = player.profileImage.publicUrl
  }
  playersRegistered.data.allPlayers.forEach(player => {
    const key = player.firstName.toLowerCase() + ' ' + player.lastName.toLowerCase()
    if (profileMap[key]) {
      player.profileImage = { publicUrl: profileMap[key] }
    }
  })
  const players = playersRegistered.data.allPlayers
  LeagueUtils.addLeagueStatus(league)
  const props = { league, teams, url: context.req.url, players }
  await updateWithGlobalServerSideProps(props, context)
  return { props }
}
