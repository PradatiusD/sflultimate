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
    $or: [
      {
        homeTeamScore: {
          $exists: true,
          $ne: 0
        }
      },
      {
        awayTeamScore: {
          $exists: true,
          $ne: 0
        }
      },
      {
        homeTeamForfeit: true
      },
      {
        awayTeamForfeit: true
      }
    ],
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
      score: game.homeTeamScore,
      forfeit: game.homeTeamForfeit
    }

    const awayTeam = {
      id: game.awayTeam.valueOf(),
      score: game.awayTeamScore,
      forfeit: game.awayTeamForfeit
    }

    const createEntryIfMissing = function (teamId) {
      if (!standingsMap[teamId]) {
        standingsMap[teamId] = {
          name: teamsMap[teamId],
          wins: 0,
          losses: 0,
          pointDiff: 0,
          pointsScored: 0,
          pointsAllowed: 0,
          forfeits: 0
        }
      }
    }

    createEntryIfMissing(awayTeam.id)
    createEntryIfMissing(homeTeam.id)
    if (homeTeam.forfeit || awayTeam.forfeit) {
      if (homeTeam.forfeit) {
        standingsMap[homeTeam.id].forfeits++
      }
      if (awayTeam.forfeit) {
        standingsMap[awayTeam.id].forfeits++
      }

      if (homeTeam.forfeit || awayTeam.forfeit) {
        // both teams take 13 point loss
        standingsMap[homeTeam.id].pointDiff -= 13
        standingsMap[homeTeam.id].losses++

        standingsMap[awayTeam.id].pointDiff -= 13
        standingsMap[awayTeam.id].losses++
      } else {
        if (homeTeam.forfeit) {
          standingsMap[homeTeam.id].losses++
          standingsMap[homeTeam.id].pointDiff -= 13
          standingsMap[homeTeam.id].pointsAllowed += 13
          standingsMap[homeTeam.id].pointsScored += 0
        } else if (awayTeam.forfeit) {
          standingsMap[awayTeam.id].losses++
          standingsMap[awayTeam.id].pointDiff -= 13
          standingsMap[awayTeam.id].pointsAllowed += 13
          standingsMap[awayTeam.id].pointsScored += 0
        }
      }
    } else {
      const pointDiff = Math.abs(homeTeam.score - awayTeam.score)
      let winner
      let loser
      if (homeTeam.score > awayTeam.score) {
        winner = homeTeam
        loser = awayTeam
      } else {
        winner = awayTeam
        loser = homeTeam
      }

      standingsMap[winner.id].wins++
      standingsMap[winner.id].pointDiff += pointDiff
      standingsMap[winner.id].pointsAllowed += loser.score
      standingsMap[winner.id].pointsScored += winner.score

      standingsMap[loser.id].losses++
      standingsMap[loser.id].pointDiff -= pointDiff
      standingsMap[loser.id].pointsAllowed += winner.score
      standingsMap[loser.id].pointsScored += loser.score
    }
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
