import GraphqlClient from '../../lib/graphql-client'
import { gql } from '@apollo/client'
import { HeaderNavigation } from '../../components/Navigation'
import { getMongoTimestamp } from '../../lib/utils'

export const getServerSideProps = async (context) => {
  const nameSplit = context.query.player.split('-')
  const firstName = nameSplit[0]
  const lastName = nameSplit[nameSplit.length - 1]

  const playerResults = await GraphqlClient.query({
    query: gql`
      query ($firstName: String!, $lastName: String!) {
        allLeagues(where:{isActive: true}) {
          id
          title
          earlyRegistrationStart
          earlyRegistrationEnd
          registrationStart
          registrationEnd
          lateRegistrationStart
          lateRegistrationEnd
        }
        allPlayers(where: {firstName_contains_i: $firstName, lastName_contains_i: $lastName}) {
          id
          firstName
          lastName
          preferredPositions
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
            firstName
            lastName
          }
        }
      }
    `,
    variables: {
      playerIds: playerIds,
      leagueIds: leagueIdList
    }
  })

  const playerGameStats = gameResults.data.allPlayerGameStats
  const gameToStatsMap = {}
  for (const stat of playerGameStats) {
    if (stat.game) {
      gameToStatsMap[stat.game.id] = stat
    }
  }

  const allTimeTotals = {
    assists: 0,
    scores: 0,
    defenses: 0
  }

  // Now add the team/games to the array of leagues
  leagues.forEach(function (league) {
    const foundTeamForLeague = gameResults.data.allTeams.find(function (team) {
      return team.league.id === league.id
    })
    league.totals = {
      assists: 0,
      scores: 0,
      defenses: 0,
      playerTeamScore: 0,
      opponentTeamScore: 0,
      outcomes: []
    }
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
          league.totals.opponentTeamScore += leagueGame.opponentTeamScore
          league.totals.playerTeamScore += leagueGame.playerTeamScore

          leagueGame.stats = {
            assists: gameToStatsMap[leagueGame.id]?.assists || 0,
            scores: gameToStatsMap[leagueGame.id]?.scores || 0,
            defenses: gameToStatsMap[leagueGame.id]?.defenses || 0
          }

          const keys = ['assists', 'scores', 'defenses']
          keys.forEach((key) => {
            const stat = gameToStatsMap[leagueGame.id] ? gameToStatsMap[leagueGame.id][key] : 0
            leagueGame.stats[key] = stat
            league.totals[key] += stat
            allTimeTotals[key] += stat
          })

          leagueGame.outcome = leagueGame.playerTeamScore > leagueGame.opponentTeamScore ? 'W' : 'L'
          acc.push(leagueGame)
        }
        return acc
      }, [])
    }
  })

  leagues.sort(function (a, b) {
    return getMongoTimestamp(b.id) - getMongoTimestamp(a.id)
  })

  const player = playerResults.data.allPlayers[0]
  const league = JSON.parse(JSON.stringify(playerResults.data.allLeagues[0]))
  return {
    props: {
      player: player,
      allTimeTotals: allTimeTotals,
      leagueGameStatHistory: leagues,
      league: league
    }
  }
}

export default function PlayerPage (props) {
  const { player, leagueGameStatHistory, league, allTimeTotals } = props
  return (
    <div>
      <HeaderNavigation league={league} />
      <div className="container">
        <h1>{player.firstName} {player.lastName} Profile</h1>
        <div>
          {
            player.preferredPositions && (
              <p className="lead">Preferred Positions: {Array.isArray(player.preferredPositions) ? player.preferredPositions.join(', ') : player.preferredPositions}</p>
            )
          }
          <p className="lead" style={{ display: 'flex', justifyContent: 'space-around' }}>
            <span>Scores: <strong>{allTimeTotals.scores}</strong></span>
            <span>Assists: <strong>{allTimeTotals.assists}</strong></span>
            <span>Defenses: <strong>{allTimeTotals.defenses}</strong></span>
          </p>
        </div>
        {leagueGameStatHistory.map((league, index) => (
          league.team && (
            <div key={index}>
              <h2>{league.title}</h2>
              <p className="lead" style={{ marginBottom: '0.5rem' }}>{league.team.name}</p>
              <p><strong>Captains:</strong> {league.team.captains.map(c => c.firstName.trim() + ' ' + c.lastName.trim()).join(', ')}</p>
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
                    <td colSpan="2"><strong>Total</strong></td>
                    <td><strong>{league.totals.playerTeamScore}</strong></td>
                    <td><strong>{league.totals.opponentTeamScore}</strong></td>
                    <td><strong>{league.totals.outcomes}</strong></td>
                    <td><strong>{league.totals.assists}</strong></td>
                    <td><strong>{league.totals.scores}</strong></td>
                    <td><strong>{league.totals.defenses}</strong></td>
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
