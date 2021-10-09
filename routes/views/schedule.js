const keystone = require('keystone')
const Game = keystone.list('Game')
const Team = keystone.list('Team')

module.exports = async function (req, res) {
  if (req.query.f === 'json') {
    let games = await Game.model.find({
      league: res.locals.league._id
    }).sort({
      scheduledTime: 1
    }).lean().exec()

    games = games.map((game) => {
      game.scheduledTimeEpoch = game.scheduledTime.getTime()
      return game
    })

    const teams = await Team.model.find({
      league: res.locals.league._id
    }).lean().exec()

    return res.json({ games, teams })
  }
  res.render('schedule')
}
