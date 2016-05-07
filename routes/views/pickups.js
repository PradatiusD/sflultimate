var keystone = require('keystone');
var Pickup = keystone.list('Pickup');

module.exports = function (req, res) {
 
  var query = Pickup.model.find();

  query.exec(function (err, Pickups) {

    if (err) {
      return res.status(500).json(err);
    }
    res.json(Pickups);

  });
};