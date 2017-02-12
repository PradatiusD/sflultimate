var keystone = require('keystone');

var games =[
  '02/12/2017, 4:00PM, Yellow, White',
  '02/12/2017, 4:00PM, Purple, Crimson',
  '02/12/2017, 6:00PM, Blue, Green',
  '02/19/2017, 4:00PM, Green, Purple',
  '02/19/2017, 4:00PM, Blue, White',
  '02/19/2017, 6:00PM, Crimson, Yellow',
  '02/26/2017, 4:00PM, Crimson, Blue',
  '02/26/2017, 4:00PM, Purple, Yellow',
  '02/26/2017, 6:00PM, Green, White',
  '03/05/2017, 4:00PM, Yellow, Blue',
  '03/05/2017, 4:00PM, Green, Crimson',
  '03/05/2017, 6:00PM, White, Purple',
  '03/12/2017, 4:00PM, Crimson, White',
  '03/12/2017, 4:00PM, Purple, Blue',
  '03/12/2017, 6:00PM, Yellow, Green',
  '03/19/2017, 4:00PM, Yellow, White',
  '03/19/2017, 4:00PM, Blue, Green',
  '03/19/2017, 6:00PM, Purple, Crimson',
  '03/26/2017, 4:00PM, Crimson, Yellow',
  '03/26/2017, 4:00PM, Blue, White',
  '03/26/2017, 6:00PM, Green, Purple',
  '04/02/2017, 4:00PM, Green, White',
  '04/02/2017, 4:00PM, Purple, Yellow',
  '04/02/2017, 6:00PM, Crimson, Blue',
  '04/09/2017, 4:00PM, Yellow, Blue',
  '04/09/2017, 4:00PM, Green, Crimson',
  '04/09/2017, 6:00PM, White, Purple',
  '04/30/2017, 4:00PM, Crimson, White',
  '04/30/2017, 4:00PM, Purple, Blue',
  '04/30/2017, 6:00PM, Yellow, Green'
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

  if (req.query.f === 'json') {
    return res.json(games);
  }

  res.render('schedule');
};
