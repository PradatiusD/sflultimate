const keystone = require('keystone')
const Game = keystone.list('Game')
const Team = keystone.list('Team')

/**
 * Get Current League Standings
 * @param options {object}
 * @param options.currentLeague {string}
 * @return {Promise<*[]>}
 */
module.exports.getStandings = async function (options) {
  const { currentLeague } = options
  const games = await Game.model.find({
    league: currentLeague,
    homeTeamScore: {
      $exists: true,
      $ne: 0
    },
    awayTeamScore: {
      $exists: true,
      $ne: 0
    },
    scheduledTime: {
      $lte: new Date()
    }
  }).lean()

  const standingsMap = {}

  const teams = await Team.model.find({
    league: currentLeague
  }).lean().exec()

  const teamsMap = {}
  for (const team of teams) {
    teamsMap[team._id.valueOf()] = team.name
  }
  for (const game of games) {
    const homeTeam = {
      id: game.homeTeam.valueOf(),
      score: game.homeTeamScore
    }

    const awayTeam = {
      id: game.awayTeam.valueOf(),
      score: game.awayTeamScore
    }

    let winner
    let loser
    const pointDiff = Math.abs(homeTeam.score - awayTeam.score)
    if (homeTeam.score > awayTeam.score) {
      winner = homeTeam
      loser = awayTeam
    } else {
      winner = awayTeam
      loser = homeTeam
    }

    const createEntryIfMissing = function (teamId) {
      if (!standingsMap[teamId]) {
        standingsMap[teamId] = {
          name: teamsMap[teamId],
          wins: 0,
          losses: 0,
          pointDiff: 0,
          pointsScored: 0,
          pointsAllowed: 0
        }
      }
    }

    createEntryIfMissing(winner.id)
    standingsMap[winner.id].wins++
    standingsMap[winner.id].pointDiff += pointDiff
    standingsMap[winner.id].pointsAllowed += loser.score
    standingsMap[winner.id].pointsScored += winner.score

    createEntryIfMissing(loser.id)
    standingsMap[loser.id].losses++
    standingsMap[loser.id].pointDiff -= pointDiff
    standingsMap[loser.id].pointsAllowed += winner.score
    standingsMap[loser.id].pointsScored += loser.score
  }

  const standings = []
  for (const id in standingsMap) {
    const teamEntry = standingsMap[id]
    const totalGames = teamEntry.wins + teamEntry.losses
    teamEntry.avgPointsScoredPerGame = (teamEntry.pointsScored / totalGames).toFixed(2)
    teamEntry.avgPointsAllowedPerGame = (teamEntry.pointsAllowed / totalGames).toFixed(2)
    teamEntry.teamId = id
    standings.push(teamEntry)
  }
  standings.sort(function (a, b) {
    const winDiff = b.wins - a.wins
    if (winDiff !== 0) {
      return winDiff
    }
    return b.pointDiff - a.pointDiff
  })
  return standings
}
