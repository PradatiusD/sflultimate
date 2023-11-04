const keystone = require('keystone')
const Player = keystone.list('Player')
const League = keystone.list('League')
const Team = keystone.list('Team')
const Game = keystone.list('Game')
const PlayerGameStat = keystone.list('PlayerGameStat')

function getId (item) {
  return item._id
}

module.exports = async function (req, res) {
  const { playerSlug } = req.params
  const [firstName, lastName] = playerSlug.split('-')

  const playerFindParams = {
    'name.first': new RegExp(firstName, 'i'),
    'name.last': new RegExp(lastName, 'i')
  }

  const matchingPlayers = await Player.model.find(playerFindParams, { leagues: 1, name: 1 }).sort({ _id: -1 }).lean()

  const leagueFindParams = {
    _id: {
      $in: matchingPlayers.reduce(function (acc, player) {
        if (player.leagues) {
          acc = acc.concat(player.leagues)
        }
        return acc
      }, [])
    }
  }
  const matchingLeagues = await League.model.find(leagueFindParams, {
    title: 1,
    registrationStart: 1
  }).lean()

  const playerIds = matchingPlayers.map(getId)
  const matchingTeams = await Team.model.find({
    $or: [
      {
        captains: {
          $in: playerIds
        }
      },
      {
        players: {
          $in: playerIds
        }
      }
    ]
  }, {
    players: 0,
    captains: 0
  }).lean()

  const teamIds = matchingTeams.map(getId)
  const matchingGames = await Game.model.find({
    $or: [
      {
        homeTeam: {
          $in: teamIds
        }
      },
      {
        awayTeam: {
          $in: teamIds
        }
      }
    ]
  }).lean()

  const matchingPlayerGameStats = await PlayerGameStat.model.find({
    game: {
      $in: matchingGames.map(getId)
    },
    player: {
      $in: playerIds
    }
  }).lean()

  // league in order
  const leagueGameStatHistory = matchingLeagues.sort(function (a, b) {
    return b._id.getTimestamp() - a._id.getTimestamp()
  })

  const leagueToGamesMap = {}
  matchingGames.forEach(function (game) {
    const leagueId = game.league.toString()
    if (!leagueToGamesMap[leagueId]) {
      leagueToGamesMap[leagueId] = []
    }
    leagueToGamesMap[leagueId].push(game)
  })

  const gameToStatMap = {}
  matchingPlayerGameStats.forEach(function (stat) {
    const gameId = stat.game.toString()
    gameToStatMap[gameId] = stat
  })

  const leagueToTeamMap = {}
  matchingTeams.forEach(function (team) {
    const leagueId = team.league.toString()
    leagueToTeamMap[leagueId] = team
  })

  const teamNames = await Team.model.find({}, { name: 1 })
  const teamNamesMap = {}
  teamNames.forEach(function (team) {
    teamNamesMap[team._id.toString()] = team.name
  })

  for (const league of leagueGameStatHistory) {
    const leagueId = league._id.toString()
    league.totals = { assists: 0, scores: 0, defenses: 0, playerTeamScore: 0, opponentTeamScore: 0, outcomes: [] }
    league.team = leagueToTeamMap[leagueId]
    const leagueGames = leagueToGamesMap[leagueId] || []
    league.games = leagueGames.filter(function (game) {
      const noPointsOnEitherTeam = game.awayTeamScore === 0 && game.homeTeamScore === 0
      const hasHomeScoreUndefined = typeof game.homeTeamScore === 'undefined'
      const hasAwayScoreUndefined = typeof game.awayTeamScore === 'undefined'
      return !(noPointsOnEitherTeam || hasHomeScoreUndefined || hasAwayScoreUndefined)
    })
    league.games = league.games.sort(function (a, b) {
      return b.scheduledTime.getTime() - a.scheduledTime.getTime()
    })
    for (const game of league.games) {
      game.stats = gameToStatMap[game._id.toString()] || { assists: 0, scores: 0, defenses: 0 }
      league.totals.assists += game.stats.assists || 0
      league.totals.scores += game.stats.scores || 0
      league.totals.defenses += game.stats.defenses || 0

      const isHomeTeamPlayerTeam = game.homeTeam.toString() === league.team._id.toString()
      game.playerTeamScore = isHomeTeamPlayerTeam ? game.homeTeamScore : game.awayTeamScore
      game.opponentTeamScore = !isHomeTeamPlayerTeam ? game.homeTeamScore : game.awayTeamScore
      game.opponentTeamName = !isHomeTeamPlayerTeam ? teamNamesMap[game.homeTeam.toString()] : teamNamesMap[game.awayTeam.toString()]
      game.outcome = game.playerTeamScore > game.opponentTeamScore ? 'W' : 'L'

      league.totals.opponentTeamScore += game.opponentTeamScore
      league.totals.playerTeamScore += game.playerTeamScore
      league.totals.outcomes.push(game.outcome)
    }
    // collapse into win loss (2W-2L)
    league.totals.outcomes = league.totals.outcomes.sort().reduce(function (acc, entry) {
      acc[entry]++
      return acc
    }, { W: 0, L: 0 })
    league.totals.outcomes = league.totals.outcomes.W + 'W - ' + league.totals.outcomes.L + 'L'
  }

  res.locals.player = matchingPlayers[0]
  res.locals.leagueGameStatHistory = leagueGameStatHistory
  res.render('player')
}
