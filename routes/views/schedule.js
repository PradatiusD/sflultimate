var keystone = require("keystone");

module.exports = function(req, res) {
  
  var view = new keystone.View(req, res);

  var games = [
    "2/21/2016, 5:00PM, Orange, Blue",
    "2/21/2016, 5:00PM, Red, Grey",
    "2/21/2016, 7:00PM, Green, Yellow",
    "2/21/2016, 7:00PM, Black, White",
    "2/28/2016, 5:00PM, Blue, Yellow",
    "2/28/2016, 5:00PM, Red, Black",
    "2/28/2016, 7:00PM, Orange, Green",
    "2/28/2016, 7:00PM, Grey, White",
    "3/13/2016, 5:00PM, Grey, Black",
    "3/13/2016, 5:00PM, Red, White",
    "3/13/2016, 7:00PM, Blue, Green",
    "3/13/2016, 7:00PM, Orange, Yellow",
    "3/20/2016, 5:00PM, Blue, Grey",
    "3/20/2016, 5:00PM, Green, Black",
    "3/20/2016, 7:00PM, Orange, Red",
    "3/20/2016, 7:00PM, Yellow, White",
    "4/3/2016, 5:00PM, Orange, White",
    "4/3/2016, 5:00PM, Red, Yellow",
    "4/3/2016, 7:00PM, Blue, Black",
    "4/3/2016, 7:00PM, Green, Grey",
    "4/10/2016, 5:00PM, Orange, Black",
    "4/10/2016, 5:00PM, Red, Green",
    "4/10/2016, 7:00PM, White, Blue",
    "4/10/2016, 7:00PM, Yellow, Grey",
    "4/17/2016, 5:00PM, Black, Yellow",
    "4/17/2016, 5:00PM, Red, Blue",
    "4/17/2016, 7:00PM, Orange, Grey",
    "4/17/2016, 7:00PM, Green, White",
    "4/24/2016, 5:00PM, Orange, Blue",
    "4/24/2016, 5:00PM, Red, Grey",
    "4/24/2016, 7:00PM, Green, Yellow",
    "4/24/2016, 7:00PM, Black, White"
  ];

  games = games.map(function (game) {

    game = game.split(', ');

    game = {
      date: game[0],
      time: game[1],
      home: game[2],
      away: game[3]
    };

    return game;
  });

  res.locals.games = games;

  res.render('schedule');
};
