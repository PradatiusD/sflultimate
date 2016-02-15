var keystone = require('keystone');
var Player = keystone.list('Player');



module.exports = function (req, res) {
 
  var query = Player.model.find();

  if (req.query.registered) {
    query.where('registered', true);
  }

  query.exec(function (err, players) {

      players = players.map(function (p) {

        return {
          id:            p._id,
          email:         p.email,
          full_name:     p.name,
          skill:         p.skillLevel,
          size:          p.shirtSize,
          age:           p.ageGroup,
          participation: p.participation,
          partner:       p.partner,
          registered:    p.registered
        };

      });

      res.json(players);

    });
};