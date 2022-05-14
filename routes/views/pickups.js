const keystone = require('keystone')
const Pickup = keystone.list('Pickup')

module.exports = async function (req, res) {
  if (req.query.f === 'json') {
    const query = Pickup.model.find({
      isActive: true
    })

    return query.exec(function (err, pickups) {
      if (err) {
        return res.status(500).json(err)
      }
      res.json(pickups)
    })
  }
  res.render('pickups')
}
