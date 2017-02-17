
/*
 * mongo sflultimate scripts/create-email-lists.js 
 */

// To captain
// send email of people
var globalEmails = [];


db.teams.find({league:ObjectId('589f1ea1e233f50400259325')}).forEach(function (team) {
  
  var email = '';

  var playerEmails = '';


  db.players.find({_id: {$in: team.players}}).forEach(function (player) {

    if (player._id.valueOf() === team.captains[0].valueOf()) {
      email += '\nTo: ' + player.email;
      email += '\nSubject: '+team.color+' Team'
    }

    playerEmails += '\n<' + player.name.first + ' ' + player.name.last + '> ' + player.email;
    globalEmails.push(player.email);
  });

  // print(email);
  // print(playerEmails);
});

print(globalEmails.sort().join(", "));
