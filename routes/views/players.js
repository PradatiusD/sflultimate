const keystone = require('keystone')
const Player = keystone.list('HatterPlayer')

module.exports = function (req, res) {
  const query = Player.model.find({
    dates_registered: {
      $in: ['2020-01-11', '2020-02-02', '2020-02-11']
    }
  })

  query.exec(function (err, players) {
    if (err) {
      throw err
    }
    res.json(players)
  })
}
