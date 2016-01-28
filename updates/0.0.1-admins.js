var fs = require('fs');

/**
 * This script automatically creates a default Admin user when an
 * empty database is used for the first time. You can use this
 * technique to insert data into any List you have defined.
 * 
 * Alternatively, you can export a custom function for the update:
 * module.exports = function(done) { ... }
 */

var playerFile = 'tmp/official-players.json';
var players;
var adminSet = false;

if (fs.existsSync(playerFile)) {

  var players = fs.readFileSync(playerFile, 'utf8');
  players     = JSON.parse(players);

  players     = players.map(function (p) {
    return {
      'name.first':  p.FName,
      'name.last':   p.LName,
      email:         p.Email,
      shirtSize:     p.Shirt,
      password:      p.FName.substring(0,1)+p.LName,
      skillLevel:    parseInt(p.Skill),
      participation: parseInt(p.Attendance),
      isAdmin:       false,
      registered:    false,
    };
  });

} else {
  players = [];
}

for (var i = 0; i < players.length; i++) {
  if(players[i].email === "danielprada2012@gmail.com") {
    players[i].password = process.env.KEYSTONE_PASSWORD;
    players[i].isAdmin  = true;
    adminSet = true;
    break;
  }
};

if (!adminSet) {
  players.push({
    'name.first': 'Daniel', 
    'name.last': 'Prada',
    email: 'danielprada2012@gmail.com',
    password: process.env.KEYSTONE_PASSWORD,
    shirtSize: "M",
    skillLevel: 4,
    isAdmin: true
  });  
}


exports.create = {
 Player: players
};

/*

// This is the long-hand version of the functionality above:

var keystone = require('keystone'),
  async = require('async'),
  User = keystone.list('User');

var admins = [
  { email: 'user@keystonejs.com', password: 'admin', name: { first: 'Admin', last: 'User' } }
];

function createAdmin(admin, done) {
  
  var newAdmin = new User.model(admin);
  
  newAdmin.isAdmin = true;
  newAdmin.save(function(err) {
    if (err) {
      console.error("Error adding admin " + admin.email + " to the database:");
      console.error(err);
    } else {
      console.log("Added admin " + admin.email + " to the database.");
    }
    done(err);
  });
  
}

exports = module.exports = function(done) {
  async.forEach(admins, createAdmin, done);
};

*/
