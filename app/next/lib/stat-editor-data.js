import GraphqlClient from './server-graphql-client'
import { gql } from '@apollo/client'
import { getTeamGameDetails } from './stat-editor-utils'

export async function getStatEditorPageProps (context) {
  const gameId = context.params.game
  const teamId = context.params.team
  const results = await GraphqlClient.query({
    query: gql`
      query StatEditor($gameId: ID!) {
        allGames(where: {id: $gameId}) {
          id
          scheduledTime
          homeTeamScore
          awayTeamScore
          league {
            id
            title
          }
          homeTeam {
            id
            name
            players(sortBy: [gender_ASC, firstName_ASC, lastName_ASC]) {
              id
              firstName
              lastName
            }
          }
          awayTeam {
            id
            name
            players(sortBy: [gender_ASC, firstName_ASC, lastName_ASC]) {
              id
              firstName
              lastName
            }
          }
        }
        allPlayerGameStats(where: {game: {id: $gameId}}) {
          id
          assists
          scores
          defenses
          attended
          player {
            id
          }
        }
      }
    `,
    variables: { gameId }
  })

  const game = results.data.allGames[0]
  const details = game && getTeamGameDetails(game, teamId)

  if (!game || !details) {
    return { notFound: true }
  }

  const statsByPlayer = {}
  results.data.allPlayerGameStats.forEach(stat => {
    statsByPlayer[stat.player.id] = stat
  })

  const initialStats = details.team.players.map(player => ({
    player,
    gameStatId: statsByPlayer[player.id]?.id || null,
    assists: statsByPlayer[player.id]?.assists || 0,
    scores: statsByPlayer[player.id]?.scores || 0,
    defenses: statsByPlayer[player.id]?.defenses || 0,
    attended: statsByPlayer[player.id]?.attended || false
  }))

  return {
    props: {
      game,
      team: details.team,
      opponent: details.opponent,
      isHomeTeam: details.isHomeTeam,
      initialTeamScore: details.teamScore,
      initialOpponentScore: details.opponentScore,
      initialStats
    }
  }
}
