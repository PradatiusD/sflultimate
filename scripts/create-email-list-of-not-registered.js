// mongo mongodb://localhost/sflultimate

var activeLeague = db.leagues.findOne({ isActive: true })

var registeredEmails = db.players.find({
  leagues: {
    $in: [activeLeague._id]
  }
}, { email: 1, leagues: 1 }).toArray().map(function (player) {
  return player.email
})

var allPlayers = db.players.find({}, { email: 1 }).toArray().map(p => p.email)
var allHatterPlayers = db.players.find({}, { email: 1 }).toArray().map(p => p.email)
var combinedPlayers = allPlayers.concat(allHatterPlayers).filter(function (email, index, self) {
  return registeredEmails.indexOf(email) === -1 && self.indexOf(email) === index
})
printjson(combinedPlayers)
