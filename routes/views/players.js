const keystone = require('keystone')
const Player = keystone.list('Player')
const League = keystone.list('League')
const Team = keystone.list('Team')

module.exports = async function (req, res) {
  const activeLeague = await League.model.findOne({ isActive: true }).lean().exec()
  const query = {
    leagues: {
      $in: [activeLeague._id]
    }
  }

  const teams = await Team.model.find().where('league', activeLeague._id).lean().exec()
  const playerMap = {}
  for (const team of teams) {
    for (const player of team.players) {
      playerMap[player.valueOf()] = {
        _id: team._id,
        color: team.color,
        name: team.name
      }
    }
  }

  const players = await Player.model.find(query, { password: 0, email: 0, isAdmin: 0 }).lean().exec()
  for (const player of players) {
    player.team = playerMap[player._id.valueOf()]
  }

  res.json(players)
}
