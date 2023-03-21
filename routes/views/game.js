const keystone = require('keystone')
const Game = keystone.list('Game')
const { ObjectID } = require('mongodb')
const PlayerGameStat = keystone.list('PlayerGameStat')

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
    .populate('league').lean().exec()

  const playerMap = {}
  for (const key of ['homeTeam', 'awayTeam']) {
    for (const player of locals.game[key].players) {
      playerMap[player.toString()] = key
    }
  }

  const stats = await PlayerGameStat.model.find({
    game: $find._id
  }).populate('player').lean().exec()

  const awayTeamStats = stats.filter(function (stat) {
    return playerMap[stat.player._id.toString()] === 'awayTeam'
  })

  const homeTeamStats = stats.filter(function (stat) {
    return playerMap[stat.player._id.toString()] === 'homeTeam'
  })

  locals.teams = [
    {
      score: locals.game.awayTeamScore,
      name: locals.game.awayTeam.name,
      stats: awayTeamStats
    },
    {
      score: locals.game.homeTeamScore,
      name: locals.game.homeTeam.name,
      stats: homeTeamStats
    },
  ]

  // Render the view
  view.render('game')
}
