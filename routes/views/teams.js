const keystone = require('keystone')
const Team = keystone.list('Team')
const Player = keystone.list('Player')
const League = keystone.list('League')

module.exports = function (req, res) {
  // If not json render HTML page
  if (req.query.f !== 'json') {
    return res.render('teams')
  }

  const leagueQuery = League.model.findOne().where('isActive', true)

  leagueQuery.exec(function (err, league) {
    const playerQuery = Player.model.find().where('registered', true)
    const teamQuery = Team.model.find().where('league', league._id)

    teamQuery.exec(function (err, teams) {
      playerQuery.exec(function (err, players) {
        players = players.map(function (player) {
          return {
            _id: player._id,
            name: player.name,
            shirtSize: player.shirtSize,
            skillLevel: player.skillLevel,
            gender: player.gender
            // email:      player.email,
          }
        })

        res.json({
          players: players,
          teams: teams
        })
      })
    })
  })
}
