const keystone = require('keystone')
const Game = keystone.list('Game')
const { ObjectID } = require('mongodb')
const PlayerGameStat = keystone.list('PlayerGameStat')
const { getStandings } = require('./../stat-utils')

exports = module.exports = async function (req, res) {
  const view = new keystone.View(req, res)
  const locals = res.locals

  const $find = {
    _id: new ObjectID(req.params.gameID)
  }

  locals.game = await Game.model.findOne($find)
    .populate('homeTeam')
    .populate('awayTeam')
    .populate('location')
    .populate('league', '-description -pricing -finalsTournament').lean().exec()

  locals.standings = await getStandings({
    currentLeague: locals.game.league._id
  })

  for (const standing of locals.standings) {
    if (standing.teamId === locals.game.homeTeam._id.toString()) {
      locals.game.homeTeam.standing = standing
    } else if (standing.teamId === locals.game.awayTeam._id.toString()) {
      locals.game.awayTeam.standing = standing
    }
  }

  const playerMap = {}
  for (const key of ['homeTeam', 'awayTeam']) {
    for (const player of locals.game[key].players) {
      playerMap[player.toString()] = key
    }
  }
  
  let stats = await PlayerGameStat.model.find({
    game: $find._id
  }).populate('player', 'name').lean().exec()

  stats = stats.map((stat) => {
    stat.throwaways = stat.throwaways || 0
    stat.drops = stat.drops || 0
    return stat
  })

  // If no stats, show preview state of all stats
  if (stats.length === 0) {
    locals.preview = true
    const playerFind = {
      player: {
        $in: locals.game.homeTeam.players.concat(locals.game.awayTeam.players)
      }
    }
    stats = await PlayerGameStat.model.find(playerFind).populate('player', 'name').lean().exec()
    // Now I need to reduce to season records
    const statMap = {}
    for (const stat of stats) {
      const id = stat.player._id.toString()
      stat.throwaways = stat.throwaways || 0
      stat.drops = stat.drops || 0
      if (!statMap[id]) {
        statMap[id] = stat
      } else {
        statMap[id].assists += stat.assists || 0
        statMap[id].scores += stat.scores || 0
        statMap[id].defenses += stat.defenses || 0
        statMap[id].throwaways += stat.throwaways || 0
        statMap[id].drops += stat.drops || 0
      }
    }
    stats = Object.values(statMap)
  }

  const awayTeamStats = stats.filter(function (stat) {
    return playerMap[stat.player._id.toString()] === 'awayTeam'
  })

  function totalContributionDescending (a, b) {
    const diff = (b.assists + b.scores + b.defenses) - (a.assists + a.scores + a.defenses)
    if (diff !== 0) {
      return diff
    }
    return a.player.name.first.localeCompare(b.player.name.first)
  }

  const homeTeamStats = stats.filter(function (stat) {
    return playerMap[stat.player._id.toString()] === 'homeTeam'
  })

  awayTeamStats.sort(totalContributionDescending)
  homeTeamStats.sort(totalContributionDescending)

  locals.teams = [
    {
      score: locals.game.awayTeamScore,
      name: locals.game.awayTeam.name,
      standing: locals.game.awayTeam.standing,
      stats: awayTeamStats
    },
    {
      score: locals.game.homeTeamScore,
      name: locals.game.homeTeam.name,
      standing: locals.game.homeTeam.standing,
      stats: homeTeamStats
    }
  ]

  // Render the view
  view.render('game')
}
