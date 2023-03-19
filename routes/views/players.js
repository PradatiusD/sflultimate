const keystone = require('keystone')
const Player = keystone.list('Player')
const Team = keystone.list('Team')
const { ObjectID } = require('mongodb')

module.exports = async function (req, res) {
  const activeLeague = res.locals.league
  if (req.method === 'PUT') {
    if (!req.user) {
      return res.status(401).json({
        code: 401,
        message: 'Not Authorized'
      })
    }

    const $findTeam = {
      _id: ObjectID(req.body.team_id)
    }
    const $updateTeam = {
      players: req.body.players.map(function (playerID) {
        return ObjectID(playerID)
      })
    }

    await Team.model.updateOne($findTeam, $updateTeam)
  }

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

  res.json({
    teams,
    players
  })
}
