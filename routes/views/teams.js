var keystone = require('keystone')
var Team = keystone.list('Team')
var Player = keystone.list('Player')
var League = keystone.list('League')

module.exports = function (req, res) {
  // If not json render HTML page
  if (req.query.f !== 'json') {
    return res.render('teams')
  }

  var leagueQuery = League.model.findOne().where('isActive', true)

  leagueQuery.exec(function (err, league) {
    var playerQuery = Player.model.find().where('registered', true)
    var teamQuery = Team.model.find().where('league', league._id)

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
