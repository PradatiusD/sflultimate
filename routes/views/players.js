var keystone = require('keystone');
var Player = keystone.list('Player');



module.exports = function (req, res) {
 
  Player.model.find()
    .exec(function (err, players) {

      players = players.map(function (p) {

        return {
          id:        p._id,
          email:     p.email,
          full_name: p.name,
          skill:     p.skillLevel,
          size:      p.shirtSize
        };

      });

      res.json(players);

    });
};