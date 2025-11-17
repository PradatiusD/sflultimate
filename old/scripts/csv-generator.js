const MongoClient = require('mongodb').MongoClient
const url = 'mongodb://localhost:27017/sflultimate'
MongoClient.connect(url, async function (err, db) {
  if (err) {
    throw err
  }

  // for each team
  // add header of games for team
  const currentLeague = await db.collection('leagues').findOne({ isActive: true })
  const teams = await db.collection('teams').find({ league: currentLeague._id }).toArray()
  // each player is an array
  for (const team of teams) {
    // get list of games
    console.log('\n\n')
    const games = await db.collection('games').find({
      $or: [
        {
          homeTeam: team._id
        },
        {
          awayTeam: team._id
        }
      ]
    }).toArray()

    const sortedGames = games.sort((a, b) => a.name.localeCompare(b.name))
    const gameColumns = ['assists', 'scores', 'defenses', 'pointsPlayed']
    const headerGameAbbrRow = []
    const headerStatRow = []
    const headerGameIDs = []

    for (const game of sortedGames) {
      for (const column of gameColumns) {
        headerGameAbbrRow.push(game.name)
        headerStatRow.push(column)
        headerGameIDs.push(game._id.toString())
      }
    }
    console.log('\t\t' + headerGameAbbrRow.join('\t'))
    console.log('\t\t' + headerGameIDs.join('\t'))
    console.log('\t\t' + headerStatRow.join('\t'))

    const allPlayerIDs = team.captains.concat(team.players)
    const allPlayersData = await db.collection('players').find({ _id: { $in: allPlayerIDs } }).toArray()
    const mappedPlayers = allPlayersData.map(function (player) {
      return {
        _id: player._id,
        name: player.name.first.trim() + ' ' + player.name.last.trim()
      }
    }).sort((a, b) => a.name.localeCompare(b.name))
    for (const player of mappedPlayers) {
      const playerStats = await db.collection('playergamestats').find({ player: player._id }).toArray()
      const gameMap = {}
      for (const playerStat of playerStats) {
        gameMap[playerStat.game.toString()] = playerStat
      }

      const playerRow = [player._id, player.name]

      for (let i = 0; i < headerGameAbbrRow.length; i++) {
        const currentGameID = headerGameIDs[i]
        if (gameMap[currentGameID]) {
          const currentColumn = headerStatRow[i]
          playerRow.push(gameMap[currentGameID][currentColumn])
        } else {
          playerRow.push('')
        }
      }
      console.log(playerRow.join('\t'))
    }
  }
  db.close()
})
