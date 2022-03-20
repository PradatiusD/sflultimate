const MongoClient = require('mongodb').MongoClient
const url = 'mongodb://localhost:27017/sflultimate'
/**
 * node scripts/fix-duplicate-player-ids.js
 */
MongoClient.connect(url, async function (err, db) {
  if (err) {
    throw err
  }
  const emails = {}
  const primaryPlayerQuery = {
    leagues: {
      $exists: true
    }
  }
  const playerCollection = db.collection('players')
  const primaryPlayers = await playerCollection.find(primaryPlayerQuery).toArray()

  primaryPlayers.forEach(function (primaryPlayer) {
    const email = primaryPlayer.email.toLowerCase()

    if (emails[email]) {
      console.log(primaryPlayer, emails[email])
      throw Error('We cannot have a duplicate player email in the same league' + email)
    } else {
      emails[email] = primaryPlayer
    }
  })

  // now find people with matching emails
  const matchingPlayers = await playerCollection.find({
    leagues: {
      $exists: false
    },
    email: {
      $in: Object.keys(emails)
    }
  }).toArray()

  const teamCollection = db.collection('teams')

  for (const secondaryPlayer of matchingPlayers) {
    // find if they were in any other team
    const secondaryPlayerID = secondaryPlayer._id
    const teams = await teamCollection.find({
      $or: [
        {
          players: secondaryPlayerID
        },
        {
          captains: secondaryPlayerID
        }
      ]
    }).toArray()

    // if no teams, just delete and modify parent record
    const primaryPlayer = emails[secondaryPlayer.email.toLowerCase()]
    const $primaryFind = {
      _id: primaryPlayer._id
    }

    if (teams.length > 0) {
      // for each team, point the player id now to the new person
      const keys = ['players', 'captains']
      for (const team of teams) {
        for (const key of keys) {
          const list = team[key]
          for (let i = 0; i < list.length; i++) {
            const hasOldPlayerID = list[i].equals(secondaryPlayerID)
            if (hasOldPlayerID) {
              console.log(team)
              list[i] = primaryPlayer._id
              await playerCollection.updateOne($primaryFind, {
                $addToSet: {
                  leagues: team.league
                }
              })
            }
          }

          console.log('Switched to ' + primaryPlayer._id)
          await teamCollection.save(team)
        }
      }
    }
    const $primaryArchiveUpdate = {
      $addToSet: {
        archivedPlayerIDs: secondaryPlayer._id
      }
    }
    await playerCollection.updateOne($primaryFind, $primaryArchiveUpdate)
    await playerCollection.remove(secondaryPlayer)
  }
  db.close()
})
