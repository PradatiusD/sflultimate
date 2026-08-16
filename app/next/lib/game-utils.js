import GraphqlClient from './graphql-client'
import { gql } from '@apollo/client'
import { updateWithGlobalServerSideProps } from './global-server-side-props'

export function buildGameUrl (league, game) {
  const gameId = typeof game === 'string' ? game : (game?.id || game?._id)
  return `/leagues/${league.slug}/games/${gameId}`
}

export async function getGamePageProps (context, options = {}) {
  const { redirectToLeagueRoute = false } = options
  const results = await GraphqlClient.query({
    query: gql`
      query {
        currentGame: allGames(where: {id: "${context.params.game}"}) {
          id
          name
          scheduledTime
          league {
            id
            title
            slug
          }
          location {
            name
          }
          homeTeamScore
          homeTeam {
            id
            name
            slug
            players {
              id
              firstName
              lastName
              preferredPositions
            }
            image {
              publicUrl
            }
          }
          awayTeamScore
          awayTeam {
            id
            name
            slug
            players {
              id
              firstName
              lastName
              preferredPositions
            }
            image {
              publicUrl
            }
          }
        }
      }`
  })

  const game = results.data.currentGame[0]

  if (!game) {
    return {
      notFound: true
    }
  }

  const canonicalUrl = buildGameUrl(game.league, game)
  if (redirectToLeagueRoute) {
    return {
      redirect: {
        destination: canonicalUrl,
        permanent: true
      }
    }
  }

  if (context.params.slug && context.params.slug !== game.league.slug) {
    return {
      redirect: {
        destination: canonicalUrl,
        permanent: true
      }
    }
  }

  let playerIds = []
  const teamIds = []

  if (game.homeTeam && game.awayTeam) {
    game.awayTeam.score = game.awayTeamScore
    game.homeTeam.score = game.homeTeamScore
    playerIds = game.homeTeam.players.concat(game.awayTeam.players).map(player => player.id)
    teamIds.push(game.homeTeam.id, game.awayTeam.id)
  }

  const isGamePreview = new Date(game.scheduledTime).getTime() > Date.now()

  const statsResults = await GraphqlClient.query({
    query: gql`
      query($playerIds: [ID!]!, $gameSearch: GameWhereInput) {
        allPlayerGameStats(where: {player: {id_in: $playerIds }, game: $gameSearch}) {
          id
          defenses
          scores
          assists
          attended
          player {
            id
          }
          game {
            id
          }
        }
      }
    `,
    variables: {
      playerIds,
      gameSearch: isGamePreview ? {} : { id: game.id }
    }
  })

  const seasonResults = await GraphqlClient.query({
    query: gql`
      query($teamIds: [ID!]) {
        seasonGames: allGames(where: {league: {id: "${game.league.id}"}, OR: [{homeTeam: {id_in: $teamIds}}, {awayTeam: {id_in: $teamIds}}]}) {
          id
          homeTeam {
            id
            name
            slug
            image {
              publicUrl
            }
          }
          awayTeam {
            id
            name
            slug
            image {
              publicUrl
            }
          }
          homeTeamScore
          awayTeamScore
        }
      }
    `,
    variables: {
      teamIds
    }
  })

  const playerMap = {}
  for (const stat of statsResults.data.allPlayerGameStats) {
    playerMap[stat.player.id] = stat
  }

  let teams = []
  if (game.homeTeam && game.awayTeam) {
    teams.push(game.homeTeam, game.awayTeam)
  }

  teams = teams.map(function (team) {
    const newTeam = Object.assign({}, team)
    newTeam.stats = []
    team.players.forEach(player => {
      const stat = playerMap[player.id]
      if (stat) {
        const newStat = {
          player,
          assists: stat.assists || 0,
          scores: stat.scores || 0,
          defenses: stat.defenses || 0,
          throwaways: stat.throwaways || 0,
          drops: stat.drops || 0,
          attended: stat.attended || false
        }
        newStat.total = newStat.assists + newStat.scores + newStat.defenses
        if (newStat.total > 0 && stat.attended === false) {
          newStat.attended = true
        }
        newTeam.stats.push(newStat)
      }
    })

    newTeam.stats.sort((a, b) => {
      return b.total - a.total
    })

    return newTeam
  })

  const props = {
    game,
    games: seasonResults.data.seasonGames,
    teams,
    isGamePreview
  }

  await updateWithGlobalServerSideProps(props, context)
  return {
    props
  }
}
