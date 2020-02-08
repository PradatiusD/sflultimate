const keystone = require('keystone')
const url = require('url')

module.exports = function (req, res) {
  const view = new keystone.View(req, res)

  const { referer } = req.headers

  if (!referer) {
    return view.render('errors/500')
  }

  const parsedURL = new url.URL(referer)
  const validPathNames = ['/register-team', '/register']

  if (validPathNames.indexOf(parsedURL.pathname) > -1) {
    view.render('confirmation')
  } else {
    view.render('errors/500')
  }
}
