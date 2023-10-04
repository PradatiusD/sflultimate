
/*
 * This script builds lists of email/phone numbers per team.
 * To run this, have a copy of the database and run:
 * mongo sflultimate scripts/create-email-lists.js
 */

const leagues = db.leagues.find({ isActive: true }).toArray()
const globalEmails = db.players.find({
  leagues: {
    $in: [leagues[0]._id]
  }
}, { email: 1 }).toArray().map(d => d.email).join(', ')
printjson(globalEmails)

db.teams.find({
  league: leagues[0]._id
}).forEach(function (team) {
  const playerIDs = {
    _id: {
      $in: team.players
    }
  }

  const toField = []
  let playerEmails = ''
  const captainIDs = team.captains.map(function (id) {
    return id.valueOf()
  })

  db.players.find(playerIDs).forEach(function (player) {
    const isCaptain = captainIDs.indexOf(player._id.valueOf()) > -1
    if (isCaptain) {
      toField.push(player.email)
    }

    const rowValues = [
      '<' + player.name.first + ' ' + player.name.last + '> ' + player.email,
    ]
    if (player.phoneNumber) {
      rowValues.push(player.phoneNumber)
    }
    playerEmails += '\n ' + rowValues.join(' • ')
  })

  print('\n\nTo: ' + toField.join(','))
  print('Subject: ' + team.color + ' Team')
  print(playerEmails)
})
