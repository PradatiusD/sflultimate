const keystone = require('keystone')
const Team = keystone.list('Team')
const Player = keystone.list('Player')
const League = keystone.list('League')

module.exports = async function (req, res) {
  const league = await League.model.findOne().where('isActive', true)
  res.locals.league = league
  // If not json render HTML page
  if (req.query.f !== 'json') {
    return res.render('teams')
  }

  const $find = {
    leagues: {
      $in: [league._id]
    }
  }
  const $project = {
    password: 0,
    email: 0
  }
  const players = await Player.model.find($find, $project)

  const teams = await Team.model.find().where('league', league._id)

  res.json({
    league,
    players,
    teams
  })
}
