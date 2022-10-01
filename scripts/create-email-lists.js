
/*
 * To captain
 * send email of people
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
  let email = ''

  let playerEmails = ''

  db.players.find({ _id: { $in: team.players } }).forEach(function (player) {
    if (player._id.valueOf() === team.captains[0].valueOf()) {
      email += '\nTo: ' + player.email
      email += '\nSubject: ' + team.color + ' Team'
    }

    playerEmails += '\n<' + player.name.first + ' ' + player.name.last + '> ' + player.email
  })

  print(email)
  print(playerEmails)
})
