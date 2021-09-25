
//  mongo mongodb://heroku_8xfcj7cs:uu4ki2eos0cg4kro7k7hmr2ojs@ds039165.mongolab.com:39165/heroku_8xfcj7cs scripts/make-pairs.js
var p1 = '59f89416d4cd6b0400bc6f8a'
var p2 = '59f93670c5ab6904000ecfe5'

db.players.find({ _id: ObjectId(p1) }).forEach(function (player) {
  player.partner = ObjectId(p2)
  printjson(player)
  db.players.save(player)
})

// db.players.find({_id:ObjectId(p2)}).forEach(function (player) {
//     player.partner = ObjectId(p1);
//     printjson(player);
//     db.players.save(player);
// });
