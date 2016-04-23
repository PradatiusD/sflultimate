var keystone = require('keystone');

exports = module.exports = function(req, res) {
  
  var view = new keystone.View(req, res);
  var locals = res.locals;
  
  // locals.section is used to set the currently selected
  // item in the header navigation.
  locals.section = 'home';

  var standings = {
    "Blue": {
      "wins": 1,
      "losses": 6,
      "pointDiff": -34
    },
    "Orange": {
      "wins": 5,
      "losses": 2,
      "pointDiff": 33
    },
    "Grey": {
      "wins": 4,
      "losses": 3,
      "pointDiff": 6
    },
    "Red": {
      "wins": 1,
      "losses": 6,
      "pointDiff": -39
    },
    "Yellow": {
      "wins": 6,
      "losses": 1,
      "pointDiff": 40
    },
    "Green": {
      "wins": 4,
      "losses": 3,
      "pointDiff": 4
    },
    "White": {
      "wins": 5,
      "losses": 2,
      "pointDiff": 13
    },
    "Black": {
      "wins": 2,
      "losses": 5,
      "pointDiff": -23
    }
  };



  if (req.query.f === "json") {
    return res.json(standings);
  }
  
  // Render the view
  view.render('index');
  
};
