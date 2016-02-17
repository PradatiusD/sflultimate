var keystone = require('keystone');
var Team     = keystone.list('Team');
var Player   = keystone.list('Player');

module.exports = function (req, res) {

  Team.model.find().exec(function (err, teams){

    var captains = [];

    teams.forEach(function (team) {
      captains = captains.concat(team.captains);
    });

    var query = {
      _id: {
        "$in": captains
      }
    };

    Player.model.find(query).exec(function (err, captainsWithData) {

      var emails = captainsWithData.map(function (d) {
        return d.email;
      });

      res.json(emails);
    });
  });
};