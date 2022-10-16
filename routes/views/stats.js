const keystone = require('keystone')
const PlayerGameStat = keystone.list('PlayerGameStat')
const Player = keystone.list('Player')
const Game = keystone.list('Game')
const Team = keystone.list('Team')
const { ObjectId } = require('mongodb')

module.exports = async function (req, res) {
  const activeLeague = res.locals.league

  if (req.method === 'POST') {
    const records = req.body.items.map((item) => {
      if (!item._id) {
        item._id = new ObjectId()
        item.createdAt = new Date()
      } else {
        item.createdAt = new Date(item.createdAt)
      }
      item.updatedAt = new Date()
      return item
    })
    const dbOperations = await PlayerGameStat.model.bulkWrite(records.map(doc => ({
      updateOne: {
        filter: { _id: doc._id },
        update: doc,
        upsert: true
      }
    })))

    return res.json({
      status: 'ok',
      data: dbOperations
    })
  }

  if (req.query.f !== 'json') {
    return res.render('stats')
  }

  const leagueGames = await Game.model.find({
    league: activeLeague._id
  }).lean().exec()

  if (req.query.raw === 'true') {
    const data = await PlayerGameStat.model.find({
      game: {
        $in: leagueGames.map(game => game._id)
      }
    })
    return res.json({
      items: data
    })
  }

  const stats = await PlayerGameStat.model.aggregate([
    {
      $match: {
        game: {
          $in: leagueGames.map(game => game._id)
        }
      }
    },
    {
      $group: {
        _id: {
          player: '$player'
        },
        assists: {
          $sum: '$assists'
        },
        scores: {
          $sum: '$scores'
        },
        defenses: {
          $sum: '$defenses'
        },
        pointsPlayed: {
          $sum: '$pointsPlayed'
        }
      }
    },
    {
      $project: {
        player: '$_id.player',
        assists: '$assists',
        scores: '$scores',
        defenses: '$defenses',
        pointsPlayed: '$pointsPlayed'
      }
    }
  ])

  const playerIDs = stats.map((playerGameStat) => {
    return playerGameStat.player
  })

  const players = await Player.model.find({
    _id: {
      $in: playerIDs
    }
  }, {
    name: 1,
    gender: 1
  }).sort({}).lean().exec()

  const teams = await Team.model.find({
    league: activeLeague._id
  }, {
    color: 1,
    captains: 1,
    players: 1
  }).sort({}).lean().exec()

  return res.json({
    stats,
    players,
    teams
  })
}
