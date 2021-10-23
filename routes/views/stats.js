const keystone = require('keystone')
const PlayerGameStat = keystone.list('PlayerGameStat')
const Player = keystone.list('Player')
const League = keystone.list('League')
const Game = keystone.list('Game')
const Team = keystone.list('Team')

module.exports = async function (req, res) {
  if (req.query.f === 'json') {
    const activeLeague = await League.model.findOne({ isActive: true }).lean().exec()

    const leagueGames = await Game.model.find({
      league: activeLeague._id
    }).lean().exec()

    const stats = await PlayerGameStat.model.find({
      game: {
        $in: leagueGames
      }
    }).sort({}).lean().exec()

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
  res.render('stats')
}
