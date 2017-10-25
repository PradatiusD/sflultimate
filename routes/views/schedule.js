var games = [
  '02/12/2017, 4:00PM, Yellow, White',
  '02/12/2017, 4:00PM, Purple, Crimson',
  '02/12/2017, 6:00PM, Blue, Green',
  '02/19/2017, 4:00PM, Yellow, Green',
  '02/19/2017, 4:00PM, Purple, Blue',
  '02/19/2017, 6:00PM, Crimson, White',
  '02/26/2017, 4:00PM, Blue, White',
  '02/26/2017, 4:00PM, Crimson, Yellow',
  '02/26/2017, 6:00PM, Green, Purple',
  '03/05/2017, 4:00PM, White, Purple',
  '03/05/2017, 4:00PM, Green, Crimson',
  '03/05/2017, 6:00PM, Yellow, Blue',
  '03/12/2017, 4:00PM, Crimson, Blue',
  '03/12/2017, 4:00PM, Purple, Yellow',
  '03/12/2017, 6:00PM, Green, White',
  '03/19/2017, 4:00PM, White, Yellow',
  '03/19/2017, 4:00PM, Green, Blue',
  '03/19/2017, 6:00PM, Crimson, Purple',
  '03/26/2017, 5:00PM, White, Crimson',
  '03/26/2017, 5:00PM, Blue, Purple',
  '03/26/2017, 7:00PM, Green, Yellow',
  '04/02/2017, 4:00PM, White, Blue',
  '04/02/2017, 4:00PM, Yellow, Crimson',
  '04/02/2017, 6:00PM, Purple, Green',
  '04/09/2017, 4:00PM, Purple, White',
  '04/09/2017, 4:00PM, Crimson, Green',
  '04/09/2017, 6:00PM, Blue, Yellow',
  '04/30/2017, 4:00PM, White, Green',
  '04/30/2017, 4:00PM, Yellow, Purple',
  '04/30/2017, 6:00PM, Blue, Crimson',
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

  if (req.query.f === 'json') {
    return res.json(games);
  }

  res.render('schedule');
};
