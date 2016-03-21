var keystone = require('keystone');

exports = module.exports = function(req, res) {
  
  var view = new keystone.View(req, res);
  var locals = res.locals;
  
  // locals.section is used to set the currently selected
  // item in the header navigation.
  locals.section = 'home';

  var standings = [
    {
      "color": "Orange",
      "wins": 2,
      "losses": 2
    },
    {
      "color": "Gray",
      "wins": 4,
      "losses": 0
    },
    {
      "color": "Blue",
      "wins": 1,
      "losses": 3
    },
    {
      "color": "White",
      "wins": 3,
      "losses": 1
    },
    {
      "color": "Black",
      "wins": 1,
      "losses": "3"
    },
    {
      "color": "Red",
      "wins": 0,
      "losses": 4
    },
    {
      "color": "Yellow",
      "wins": "3",
      "losses": 1
    },
    {
      "color": "Green",
      "wins": 2,
      "losses": 2
    }
  ];

  if (req.query.f === "json") {
    return res.json(standings);
  }
  
  // Render the view
  view.render('index');
  
};
