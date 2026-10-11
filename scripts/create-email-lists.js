/*
 * This script builds lists of email/phone numbers per team.
 * To run this, have a copy of the database and run:
 * mongosh sflultimateV5 scripts/create-email-lists.js
 */

/* global db, print */

const leagues = db.leagues.find({ isActive: true }).toArray()
db.teams.find({
  league: leagues[0]._id
}).forEach(function (team) {
  team.players = db.team_players_manies.find({
    Team_left_id: team._id
  }).toArray().map(function (join) {
    return join.Player_right_id
  })
  const playerIDs = {
    _id: {
      $in: team.players
    }
  }

  const toField = []
  let playerEmails = ''
  const captainIDs = db.team_captains_manies.find({ Team_left_id: team._id }).toArray().map(function (join) {
    return join.Player_right_id.toString()
  })

  db.players.find(playerIDs).forEach(function (player) {
    const isCaptain = captainIDs.indexOf(player._id.toString()) > -1
    if (isCaptain) {
      toField.push(player.email)
    }

    const rowValues = [
      '<' + player.firstName.trim() + ' ' + player.lastName.trim() + '> ' + player.email
    ]
    if (player.phoneNumber) {
      rowValues.push(player.phoneNumber)
    }
    playerEmails += '\n ' + rowValues.join(' • ')
  })

  print('\n\nTo: ' + toField.join(','))
  print('Subject: ' + team.name)
  print(playerEmails)
})
