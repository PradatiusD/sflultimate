var keystone = require("keystone");


var games =[
  "10/04/2016, 8:00PM, Green, Pink",
  "10/04/2016, 8:00PM, Black, Blue",
  "10/11/2016, 8:00PM, Pink, Blue",
  "10/11/2016, 8:00PM, Black, Green",
  "10/18/2016, 8:00PM, Pink, Black",
  "10/18/2016, 8:00PM, Blue, Green",
  "10/25/2016, 8:00PM, Green, Pink",
  "10/25/2016, 8:00PM, Black, Blue",
  "11/01/2016, 8:00PM, Pink, Blue",
  "11/01/2016, 8:00PM, Black, Green",
  "11/08/2016, 8:00PM, Pink, Black",
  "11/08/2016, 8:00PM, Blue, Green",
  "11/15/2016, 8:00PM, Green, Pink",
  "11/15/2016, 8:00PM, Black, Blue",
  "11/22/2016, 8:00PM, Pink, Blue",
  "11/22/2016, 8:00PM, Black, Green",
  "12/06/2016, 8:00PM, Pink, Black",
  "12/06/2016, 8:00PM, Blue, Green"
];

games = games.map(function (game) {

  game = game.split(', ');

  game = {
  /* ['4/24/2016', '7:00PM'     , 'Black'      , 'White' ] */
    date: game[0], time: game[1], home: game[2], away: game[3]
  };

  return game;
});

module.exports = function(req, res) {
  
  var view = new keystone.View(req, res);

  if (req.query.f === "json") {
    return res.json(games);
  }

  res.render('schedule');
};
