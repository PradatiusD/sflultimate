/**
 * This file is where you define your application routes and controllers.
 *
 * Start by including the middleware you want to run for every request;
 * you can attach middleware to the pre("routes") and pre("render") events.
 *
 * For simplicity, the default setup for route controllers is for each to be
 * in its own file, and we import all the files in the /routes/views directory.
 *
 * Each of these files is a route controller, and is responsible for all the
 * processing that needs to happen for the route (e.g. loading data, handling
 * form submissions, rendering the view template, etc).
 *
 * Bind each route pattern your application should respond to in the function
 * that is exported from this module, following the examples below.
 *
 * See the Express application routing documentation for more information:
 * http://expressjs.com/api.html#app.VERB
 */

const keystone = require('keystone')
const middleware = require('./middleware')
const importRoutes = keystone.importer(__dirname)

// Common Middleware
keystone.pre('routes', middleware.initLocals)
keystone.pre('render', middleware.flashMessages)

// Import Route Controllers
const routes = {
  views: importRoutes('./views')
}

// Setup Route Bindings
module.exports = function (app) {
  // Views
  app.get('/', routes.views.index)
  app.get('/blog/:category?', routes.views.blog)
  app.get('/blog/post/:post', routes.views.post)
  app.get('/gallery', routes.views.gallery)
  app.all('/contact', routes.views.contact)
  app.get('/signature', routes.views.signature)
  app.get('/confirmation', routes.views.confirmation)
  app.get('/players', routes.views.players)
  app.get('/pickups', routes.views.pickups)
  app.get('/captains', routes.views.captains)
  app.get('/schedule', routes.views.schedule)
  app.get('/teams', routes.views.teams)
  app.get('/club-teams', routes.views.clubTeams)
  app.get('/events', routes.views.events)
  app.all('/stats', routes.views.stats)

  // Content Pages
  const contentRoutes = [
    'terms',
    'privacy',
    'draftboard',
    'stats',
    'sheets',
    'clinics'
  ]

  contentRoutes.forEach((url) => {
    const jadeTemplate = url.replace('/', '')
    app.get(`/${url}`, (req, res) => {
      res.render(jadeTemplate)
    })
  })

  // const regPeriod = keystone.get('isRegistrationPeriod').mode
  // if (regPeriod === 'league') {
  app.all('/register', routes.views.register)
  // } else if (regPeriod === 'tournament') {
  //   app.all('/register-team', routes.views.registerTeams)
  // }

  // Redirect old pages to homepage
  const oldSitePages = [
    '/sched.html',
    '/teams.html',
    '/about.html',
    '/statistics.asp',
    '/pics.html',
    '/community.html',
    '/sched.asp',
    '/players.asp',
    '/register.html',
    '/bio.asp',
    '/images/n-logo.png'
  ]
  app.get(oldSitePages, function (req, res) {
    res.redirect(301, '/')
  })

  app.get('/community', function (req, res) {
    res.redirect(301, '/pickups')
  })
  // NOTE: To protect a route so that only admins can see it, use the requireUser middleware:
  // app.get("/protected", middleware.requireUser, routes.views.protected);
}
