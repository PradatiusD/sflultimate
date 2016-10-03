var keystone = require('keystone');
var Team     = keystone.list('Team');
var Player   = keystone.list('Player');
var _        = require('underscore');

module.exports = function (req, res) {

  // If not json render HTML page
  if (req.query.f !== "json") {
    return res.render('teams');
  }

  // Else send data
  var playerQuery = Player.model.find().where('registered', true);
  var teamQuery   = Team.model.find().where('league','57ebb08fbbdf090300cda6e7');

  teamQuery.exec(function (err, teams) {

    playerQuery.exec(function (err, players) {

      players = players.map(function (player) {
        return {
          _id:        player._id,
          name:       player.name,
          shirtSize:  player.shirtSize,
          skillLevel: player.skillLevel,
          gender:     player.gender
        };
      });

      res.json({
        players: players,
        teams: teams
      });

    });
  });
};