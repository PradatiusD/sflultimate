
/*
 * To captain
 * send email of people
 * mongo sflultimate scripts/create-email-lists.js
 */

const globalEmails = []

const data = db.leagues.find({ isActive: true }).toArray()

db.teams.find({
  league: data[0]._id
}).forEach(function (team) {
  let email = ''

  let playerEmails = ''

  db.players.find({ _id: { $in: team.players } }).forEach(function (player) {
    if (player._id.valueOf() === team.captains[0].valueOf()) {
      email += '\nTo: ' + player.email
      email += '\nSubject: ' + team.color + ' Team'
    }

    playerEmails += '\n<' + player.name.first + ' ' + player.name.last + '> ' + player.email
    globalEmails.push(player.email)
  })

  print(email)
  print(playerEmails)
})

print(globalEmails.sort().join(', '))
