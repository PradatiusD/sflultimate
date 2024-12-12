import GraphqlClient from '../../lib/graphql-client'
import { gql } from '@apollo/client'

function getMongoTimestamp (idString) {
  const timestamp = idString.substring(0, 8)
  return new Date(parseInt(timestamp, 16) * 1000)
}
export const getServerSideProps = async (context) => {
  const nameSplit = context.query.player.split('-')
  const firstName = nameSplit[0]
  const lastName = nameSplit[nameSplit.length - 1]

  const playerResults = await GraphqlClient.query({
    query: gql`
      query ($firstName: String!, $lastName: String!) {
        allPlayers(where: {firstName_contains_i: $firstName, lastName_contains_i: $lastName}) {
          id
          firstName
          lastName,
          leagues {
            id
            title
          }
        }
      }`,
    variables: {
      firstName,
      lastName
    }
  })

  const playerIds = playerResults.data.allPlayers.map(player => player.id)

  // Build League Array
  const leagueIdList = []
  const leagues = playerResults.data.allPlayers.reduce(function (acc, player) {
    player.leagues.forEach(function (league) {
      if (!leagueIdList.includes(league.id)) {
        leagueIdList.push(league.id)

        acc.push(Object.assign({}, league))
      }
    })
    return acc
  }, []).sort(function (a, b) {
    return getMongoTimestamp(a.id) - getMongoTimestamp(b.id)
  })

  const gameResults = await GraphqlClient.query({
    query: gql`
      query($playerIds: [ID!], $leagueIds: [ID!]) {
        allPlayerGameStats (where:{player: {id_in: $playerIds}}) {
          assists
          scores
          defenses
          attended
          game {
            id
          }
        }
        allGames(where: {league: {id_in: $leagueIds}}) {
          id
          scheduledTime
          homeTeamScore
          awayTeamScore
          homeTeam {
            id
            name
          }
          awayTeam {
            id
            name
          }
        }
        allTeams(where: {players_some: {id_in: $playerIds}}) {
          id
          name
          league {
            id
          }
          captains {
            id
          }
        }
      }
    `,
    variables: {
      playerIds: playerIds,
      leagueIds: leagueIdList
    }
  })

  // Now add the team/games to the array of leagues
  leagues.forEach(function (league) {
    const foundTeamForLeague = gameResults.data.allTeams.find(function (team) {
      return team.league.id === league.id
    })
    if (foundTeamForLeague) {
      league.team = Object.assign({}, foundTeamForLeague)
      league.games = gameResults.data.allGames.reduce(function (acc, dbGame) {
        const isHomeTeam = dbGame.homeTeam.id === league.team.id
        const isAwayTeam = dbGame.awayTeam.id === league.team.id
        const isPlayersTeam = isHomeTeam || isAwayTeam
        const pointsOnEitherGame = dbGame.awayTeamScore !== 0 && dbGame.homeTeamScore !== 0
        const hasHomeScore = !isNaN(dbGame.homeTeamScore)
        const hasAwayScore = !isNaN(dbGame.awayTeamScore)
        const isValidGame = (pointsOnEitherGame && hasHomeScore && hasAwayScore)

        if (isPlayersTeam && isValidGame) {
          const leagueGame = Object.assign({}, dbGame)
          leagueGame.playerTeamScore = isHomeTeam ? dbGame.homeTeamScore : dbGame.awayTeamScore
          leagueGame.opponentTeamScore = isHomeTeam ? dbGame.awayTeamScore : dbGame.homeTeamScore
          leagueGame.opponentTeamName = isHomeTeam ? dbGame.awayTeam.name : dbGame.homeTeam.name

          leagueGame.stats = {}
          leagueGame.outcome = leagueGame.playerTeamScore > leagueGame.opponentTeamScore ? 'W' : 'L'
          acc.push(leagueGame)
        }
        return acc
      }, [])
      league.totals = {
        assists: 0,
        scores: 0,
        defenses: 0,
        playerTeamScore: 0,
        opponentTeamScore: 0,
        outcomes: []
      }
    }
  })

  const player = playerResults.data.allPlayers[0]
  return {
    props: {
      player: player,
      leagueGameStatHistory: leagues
    }
  }
}

export default function PlayerPage (props) {
  const { player, leagueGameStatHistory } = props
  return (
    <div>
      <div className="container">
        <h1>{player.firstName} {player.lastName} Profile</h1>
        {leagueGameStatHistory.map((league, index) => (
          league.team && (
            <div key={index}>
              <h2>{league.title}</h2>
              <p className="lead">{league.team.name}</p>
              <table className="table table-bordered table-striped">
                <thead>
                  <tr>
                    <th>Game Date</th>
                    <th>Opponent</th>
                    <th>Team Score</th>
                    <th>Opponent Score</th>
                    <th>Outcome</th>
                    <th>Assists</th>
                    <th>Scores</th>
                    <th>Defenses</th>
                  </tr>
                </thead>
                <tbody>
                  {league.games.map((game, gameIndex) => (
                    <tr key={gameIndex}>
                      <td>{new Date(game.scheduledTime).toLocaleDateString('en-US', {
                        timeZone: 'America/New_York',
                        month: 'short',
                        day: 'numeric',
                        weekday: 'short'
                      })}</td>
                      <td>{game.opponentTeamName}</td>
                      <td>{game.playerTeamScore}</td>
                      <td>{game.opponentTeamScore}</td>
                      <td>{game.outcome}</td>
                      <td>{game.stats.assists}</td>
                      <td>{game.stats.scores}</td>
                      <td>{game.stats.defenses}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="2">Total</td>
                    <td>{league.totals.playerTeamScore}</td>
                    <td>{league.totals.opponentTeamScore}</td>
                    <td>{league.totals.outcomes}</td>
                    <td>{league.totals.assists}</td>
                    <td>{league.totals.scores}</td>
                    <td>{league.totals.defenses}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )
        ))}
        {/* <pre>{JSON.stringify(leagueGameStatHistory, null, 2)}</pre> */}
      </div>
    </div>
  )
}

//   const playerIds = matchingPlayers.map(getId)
//   const matchingTeams = await Team.model.find({
//     $or: [
//       {
//         captains: {
//           $in: playerIds
//         }
//       },
//       {
//         players: {
//           $in: playerIds
//         }
//       }
//     ]
//   }, {
//     players: 0,
//     captains: 0
//   }).lean()
//
//   const teamIds = matchingTeams.map(getId)
//   const matchingGames = await Game.model.find({
//     $or: [
//       {
//         homeTeam: {
//           $in: teamIds
//         }
//       },
//       {
//         awayTeam: {
//           $in: teamIds
//         }
//       }
//     ]
//   }).lean()
//
//   const matchingPlayerGameStats = await PlayerGameStat.model.find({
//     game: {
//       $in: matchingGames.map(getId)
//     },
//     player: {
//       $in: playerIds
//     }
//   }).lean()
//
//
//   const leagueToGamesMap = {}
//   matchingGames.forEach(function (game) {
//     const leagueId = game.league.toString()
//     if (!leagueToGamesMap[leagueId]) {
//       leagueToGamesMap[leagueId] = []
//     }
//     leagueToGamesMap[leagueId].push(game)
//   })
//
//   const gameToStatMap = {}
//   matchingPlayerGameStats.forEach(function (stat) {
//     const gameId = stat.game.toString()
//     gameToStatMap[gameId] = stat
//   })
//
//   const leagueToTeamMap = {}
//   matchingTeams.forEach(function (team) {
//     const leagueId = team.league.toString()
//     leagueToTeamMap[leagueId] = team
//   })
//
//   const teamNames = await Team.model.find({}, { name: 1 })
//   const teamNamesMap = {}
//   teamNames.forEach(function (team) {
//     teamNamesMap[team._id.toString()] = team.name
//   })
//
//   for (const league of leagueGameStatHistory) {
//     const leagueId = league._id.toString()
//
//     league.team = leagueToTeamMap[leagueId]
//     const leagueGames = leagueToGamesMap[leagueId] || []
//     league.games = league.games.sort(function (a, b) {
//       return b.scheduledTime.getTime() - a.scheduledTime.getTime()
//     })
//     for (const game of league.games) {
//       game.stats = gameToStatMap[game._id.toString()] || { assists: 0, scores: 0, defenses: 0 }
//       league.totals.assists += game.stats.assists || 0
//       league.totals.scores += game.stats.scores || 0
//       league.totals.defenses += game.stats.defenses || 0
//
//       const isHomeTeamPlayerTeam = game.homeTeam.toString() === league.team._id.toString()
//       game.playerTeamScore = isHomeTeamPlayerTeam ? game.homeTeamScore : game.awayTeamScore
//       game.opponentTeamScore = !isHomeTeamPlayerTeam ? game.homeTeamScore : game.awayTeamScore
//       game.opponentTeamName = !isHomeTeamPlayerTeam ? teamNamesMap[game.homeTeam.toString()] : teamNamesMap[game.awayTeam.toString()]
//
//
//       league.totals.opponentTeamScore += game.opponentTeamScore
//       league.totals.playerTeamScore += game.playerTeamScore
//       league.totals.outcomes.push(game.outcome)
//     }
//     // collapse into win loss (2W-2L)
//     league.totals.outcomes = league.totals.outcomes.sort().reduce(function (acc, entry) {
//       acc[entry]++
//       return acc
//     }, { W: 0, L: 0 })
//     league.totals.outcomes = league.totals.outcomes.W + 'W - ' + league.totals.outcomes.L + 'L'
//   }
//
//   res.locals.player = matchingPlayers[0]
//   res.locals.leagueGameStatHistory = leagueGameStatHistory
// }

/*

block head
    meta(property="og:title"        content="Player Stats for "+ player.name.first + " " + player.name.last)
    meta(property="og:url"          content="https://www.sflultimate.com/player/" + player.name.first.toLowerCase() + '-' + player.name.last.toLowerCase())
    meta(property="og:description"  content="Click here to learn more about this player's stats!")

 */
