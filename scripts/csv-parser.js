const { MongoClient, ObjectId } = require('mongodb')
const fs = require('fs')
const url = 'mongodb://localhost:27017/sflultimate'
MongoClient.connect(url, async function (err, db) {
  if (err) {
    throw err
  }

  /**
   * Grabs Stats from CSV and inserts into MongoDB
   * @param {string} filePath
   * @return {Promise<void>}
   */
  async function insertStatsFromFile (filePath) {
    const data = fs.readFileSync(filePath, 'utf8')
    const rows = data.split('\r\n')
    const [gameAbbrevs, gameIDs, statColumns, ...playerRows] = rows
    const gameAbbrevArr = gameAbbrevs.split(',')
    const gameIDsArr = gameIDs.split(',')
    const statColumnsArr = statColumns.split(',')

    const players = playerRows.map(player => player.split(','))
    const playerGameStats = db.collection('playergamestats')
    for (const player of players) {
      const [playerIDString, playerName, ...stats] = player

      for (let i = 0; i < gameAbbrevArr.length + 2; i++) {
        const j = i + 2
        const playerID = new ObjectId(playerIDString)
        const currentGameID = new ObjectId(gameIDsArr[j])
        const $find = { player: playerID, game: currentGameID }
        const statEntry = await playerGameStats.findOne($find)
        const statColumn = statColumnsArr[j]
        const statValue = parseInt(stats[i] || 0)

        if (statEntry) {
          statEntry[statColumn] = statValue
          const $update = {
            $set: {}
          }
          $update.$set[statColumn] = statValue
          await playerGameStats.update($find, $update)
        } else {
          const newStatEntry = {
            createdAt: new Date(),
            updatedAt: new Date(),
            player: playerID,
            game: currentGameID,
            assists: 0,
            scores: 0,
            defenses: 0,
            pointsPlayed: 0
          }
          newStatEntry[statColumn] = statValue
          await playerGameStats.insert(newStatEntry)
        }
      }
    }
    console.log('Done with ' + filePath)
  }

  await insertStatsFromFile('/Users/dprad1214/Downloads/vice-city.csv')
  await insertStatsFromFile('/Users/dprad1214/Downloads/pichelo.csv')
  await insertStatsFromFile('/Users/dprad1214/Downloads/florida-man.csv')
  await insertStatsFromFile('/Users/dprad1214/Downloads/free-candy.csv')

  db.close()
})
