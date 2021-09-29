const keystone = require('keystone')
const Player = keystone.list('Player')
const League = keystone.list('League')

module.exports = async function (req, res) {
  const activeLeague = await League.model.findOne({ isActive: true }).lean().exec()
  const query = {
    leagues: {
      $in: [activeLeague._id]
    }
  }
  const players = await Player.model.find(query)
  res.json(players)
}
