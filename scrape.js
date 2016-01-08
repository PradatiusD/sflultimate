var request = require('request');
var async   = require('async');
var fs      = require('fs');

var players = fs.readFileSync('tmp/players.json', 'utf8');
players     = JSON.parse(players);


async.mapLimit(players, 1, function (player, callback) {

  var url = "http://sflultimate.com/rereg.asp?PID="+player.pid;

  request(url, function (error, response, body) {
    if (error && response.statusCode !== 200) {
      return callback(error, body);
    }

    console.log("Now querying "+player.firstName+" "+player.lastName)

    var selectedOptionRegex = /<option value="(.*?)" selected="selected">/g
    var emailRegex          = /<input type="text" name="email" value="(.*?)" \/>/

    player.shirtSize     = selectedOptionRegex.exec(body)[1];
    player.skillLevel    = selectedOptionRegex.exec(body)[1];
    player.participation = selectedOptionRegex.exec(body)[1];
    player.email         = emailRegex.exec(body)[1];

    callback(null, player);
  })

}, function (err, players) {
  fs.writeFileSync('tmp/players-data.json',JSON.stringify(players));
});


/*
 
  (function ($){
    var $players = $('.content').find('a').toArray();

    $players = $players.map(function (d) {

      var pid = $(d).attr('href').replace('rereg.asp?PID=','');
      pid = parseInt(pid);

      var text = $(d).text();
      var sep = ', ';
      var commaIndex = text.indexOf(sep);
      var firstName  = text.substring(commaIndex, text.length).replace(sep, '');
      var lastName   = text.substring(0, commaIndex);

      d = {
        pid: pid,
        firstName: firstName,
        lastName: lastName
      };

      return d;
    });

    console.log($players.length);
  })(jQuery);

  // 312 past registrants
 */