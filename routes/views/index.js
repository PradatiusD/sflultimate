const keystone = require('keystone')

exports = module.exports = function (req, res) {
  const view = new keystone.View(req, res)
  const locals = res.locals

  // locals.section is used to set the currently selected
  // item in the header navigation.
  locals.section = 'home'

  const standings = {
    // "Blue": {
    //   "wins": 1,
    //   "losses": 6,
    //   "pointDiff": -34
    // }
  }

  locals.hallOfFameImages = [
    'league-champions-2017-spring.jpg',
    'league-champions-2016-fall.jpg',
    'league-champions-2016-spring.jpg',
    'league-champions-2015-fall.jpg',
    'league-champions-2015-spring.jpg',
    'league-medals-2015-spring.jpg',
    'league-champions-2014-fall.jpg',
    'league-champions-2014-spring.jpg',
    'league-champions-2013-spring.jpg'
  ]

  if (req.query.f === 'json') {
    res.json(standings)
    return
  }

  // Render the view
  view.render('index')
}
