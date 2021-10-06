/**
 * This file contains the common middleware used by your routes.
 *
 * Extend or replace these functions as your application requires.
 *
 * This structure is not enforced, and just a starting point. If
 * you have more middleware you may want to group it as separate
 * modules in your project's /lib directory.
 */

const _ = require('underscore')
const keystone = require('keystone')

/**
 Initialises the standard view locals

 The included layout depends on the navLinks array to generate
 the navigation in the header, you may wish to change this array
 or replace it with your own templates / logic.
 */

exports.initLocals = function (req, res, next) {
  const { locals } = res

  locals.navLinks = [
    { label: 'Home', key: 'home', href: '/' }
  ]

  if (keystone.get('isRegistrationPeriod')) {
    locals.navLinks.push({ label: 'Register for Fall League', key: 'register', href: '/register' })
  }
  else {
  locals.navLinks = locals.navLinks.concat([
    {label: 'Teams',     key: 'teams',     href: '/teams'},
    {label: 'Schedule',  key: 'schedule',  href: '/schedule'},
    {label: 'Stats',     key: 'stats',     href: '/stats'}
  ]);
  }

  locals.navLinks = locals.navLinks.concat([
    { label: 'Local Pickups', key: 'community', href: '/community' },
    { label: 'Club Teams', key: 'club-teams', href: '/club-teams' },
    { label: 'Clinics/Camps', key: 'clinics', href: '/clinics' }
  ])

  locals.footerLinks = [
    { label: 'Terms & Conditions', key: 'terms', href: '/terms' },
    { label: 'Privacy Policy', key: 'privacy', href: '/privacy' },
    { label: 'Local Pickups', key: 'community', href: '/community' },
    { label: 'Clinics/Camps', key: 'clinics', href: '/clinics' }
  ]

  locals.user = req.user

  next()
}

/**
 Fetches and clears the flashMessages before a view is rendered
 */

exports.flashMessages = function (req, res, next) {
  const flashMessages = {
    info: req.flash('info'),
    success: req.flash('success'),
    warning: req.flash('warning'),
    error: req.flash('error')
  }

  res.locals.messages = _.any(flashMessages, function (msgs) { return msgs.length }) ? flashMessages : false

  next()
}

/**
 Prevents people from accessing protected pages when they're not signed in
 */

exports.requireUser = function (req, res, next) {
  if (!req.user) {
    req.flash('error', 'Please sign in to access this page.')
    res.redirect('/keystone/signin')
  } else {
    next()
  }
}
