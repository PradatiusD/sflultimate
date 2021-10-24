// get all regular emails
(function () {
  const emails = {}
  db.players.find({ leagues: { $exists: true } }).forEach(function (player) {
    const email = player.email.toLowerCase()

    if (!emails[email]) {
      emails[email] = player
    } else {
      printjson(player)
      throw Error('We have a duplicate email even in leagues')
    }
  })

  // now find people with matching emails
  const matchingPlayers = db.players.find({
    leagues: {
      $exists: false
    },
    email: {
      $in: Object.keys(emails)
    }
  }).toArray()

  matchingPlayers.forEach(function (secondaryPlayer) {
    // find if they were in any other team
    const teams = db.teams.find({
      $or: [
        {
          players: secondaryPlayer._id
        },
        {
          captains: secondaryPlayer._id
        }
      ]
    }).toArray()
    const log = {
      player: secondaryPlayer,
      teams: teams.map(function (d) {
        return d.name
      })
    }

    // if no teams, just delete and modify parent record
    if (teams.length === 0) {
      printjson(log)
      const primaryPlayer = emails[secondaryPlayer.email.toLowerCase()]
      db.players.updateOne({
        _id: primaryPlayer._id
      }, {
        $addToSet: {
          archivedPlayerIDs: secondaryPlayer._id
        }
      })
      db.players.remove(secondaryPlayer)
    }
  })
})()
