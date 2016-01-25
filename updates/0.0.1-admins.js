var fs = require('fs');

/**
 * This script automatically creates a default Admin user when an
 * empty database is used for the first time. You can use this
 * technique to insert data into any List you have defined.
 * 
 * Alternatively, you can export a custom function for the update:
 * module.exports = function(done) { ... }
 */

var playerFile = 'tmp/players-data-with-scores.json';
var players;

if (fs.existsSync(playerFile)) {

  var players = fs.readFileSync(playerFile, 'utf8');
  players     = JSON.parse(players);

  players     = players.map(function (p) {
    return {
      'name.first':  p.firstName,
      'name.last':   p.lastName,
      email:         p.email,
      shirtSize:     p.shirtSize,
      password:      p.firstName.substring(0,1)+p.lastName,
      skillLevel:    parseInt(p.skillLevel),
      participation: parseInt(p.participation),
      isAdmin:       false,
      registered:    false,
      score:         p.scores
    };
  });

} else {
  players = [];
}

exports.create = {
 Player: [
   {
     'name.first': 'Daniel', 
     'name.last': 'Prada',
     email: 'danielprada2012@gmail.com',
     password: 'pped2016',
     shirtSize: "M",
     isAdmin: true
   }
 ].concat(players)
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
