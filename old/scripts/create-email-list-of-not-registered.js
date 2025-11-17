/**
 * mongo sflultimate scripts/create-email-list-of-not-registered.js
 */

var activeLeague = db.leagues.findOne({ isActive: true })

var registeredPlayers = db.players.find({
  leagues: {
    $in: [activeLeague._id]
  }
}, { email: 1, leagues: 1 }).toArray().map(function (player) {
  return player
})

var playerIDsOnTeams = []
var teams = db.teams.find({
  league: activeLeague._id
}).toArray().forEach(function (team) {
  team.players.forEach(function (player) {
    playerIDsOnTeams.push(player.valueOf())
  })
})

// var allPlayers = db.players.find({}, { email: 1 }).toArray().map(p => p.email)
// // var allHatterPlayers = db.players.find({}, { email: 1 }).toArray().map(p => p.email)
// var combinedPlayers = allPlayers.filter(function (email, index, self) {
//   return registeredEmails.indexOf(email) === -1 && self.indexOf(email) === index
// })
var playersNotOnTeams = registeredPlayers.filter(function (player) {
  return playerIDsOnTeams.indexOf(player._id.valueOf()) === -1
}).map(function (player) {
  return player.email
})
printjson(playersNotOnTeams.join(', '))
