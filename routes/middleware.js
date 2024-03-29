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
const League = keystone.list('League')
const ObjectID = keystone.mongoose.mongo.ObjectID

/**
 *
 * @param regStart
 * @param regEnd
 * @return {boolean}
 */
function isValidRegPeriod (regStart, regEnd) {
  const now = Date.now()
  if (regStart && regEnd && regStart.getTime() < now && now < regEnd.getTime()) {
    return true
  }
  return false
}

exports.getActiveLeague = async function (req) {
  const activeLeagueQuery = {}
  const forceLeagueID = req.query.set_league_id
  if (forceLeagueID && ObjectID.isValid(forceLeagueID)) {
    activeLeagueQuery._id = new ObjectID(forceLeagueID)
  } else {
    activeLeagueQuery.isActive = true
  }
  return League.model.findOne(activeLeagueQuery).lean().exec()
}

/**
 Initialises the standard view locals

 The included layout depends on the navLinks array to generate
 the navigation in the header, you may wish to change this array
 or replace it with your own templates / logic.
 */

exports.initLocals = async function (req, res, next) {
  const { locals } = res

  const activeLeague = await exports.getActiveLeague(req)

  activeLeague.pricing = activeLeague.pricing || {
    regularStudent: 30,
    regularAdult: 55,
    lateStudent: 55,
    lateAdult: 55
  }

  locals.fees = {
    earlyStudent: activeLeague.pricing.earlyStudent,
    earlyAdult: activeLeague.pricing.earlyAdult,
    regularStudent: activeLeague.pricing.regularStudent,
    regularAdult: activeLeague.pricing.regularAdult,
    lateStudent: activeLeague.pricing.lateStudent,
    lateAdult: activeLeague.pricing.lateAdult
  }

  locals.league = activeLeague
  locals.navLinks = []

  if (activeLeague) {
    activeLeague.isEarlyRegistrationPeriod = isValidRegPeriod(activeLeague.earlyRegistrationStart, activeLeague.earlyRegistrationEnd)
    activeLeague.isRegistrationPeriod = isValidRegPeriod(activeLeague.registrationStart, activeLeague.registrationEnd)
    activeLeague.isLateRegistrationPeriod = isValidRegPeriod(activeLeague.lateRegistrationStart, activeLeague.lateRegistrationEnd) || (req.query.force_form === 'true')
    activeLeague.canRegister = activeLeague.isEarlyRegistrationPeriod || activeLeague.isRegistrationPeriod || activeLeague.isLateRegistrationPeriod

    if (activeLeague.canRegister) {
      locals.navLinks.push({ label: 'Register for ' + activeLeague.title, key: 'register', href: '/register' })
    }

    if (!activeLeague.isRegistrationPeriod || activeLeague.isLateRegistrationPeriod) {
      locals.navLinks = locals.navLinks.concat([
        { label: 'Teams', key: 'teams', href: '/teams' },
        { label: 'Schedule', key: 'schedule', href: '/schedule' },
        { label: 'Stats', key: 'stats', href: '/stats' }
      ])
    }
  }

  const evergreenLinks = [
    { label: 'Local Pickups', key: 'community', href: '/pickups' },
    { label: 'Club & College Teams', key: 'club-teams', href: '/club-teams' },
    { label: 'Our Board', key: 'board', href: '/board' },
    { label: 'Events', key: 'events', href: '/events' },
    { label: 'Beach Bash', key: 'beach-bash', href: '/beach-bash-tournament' }
  ]

  locals.navLinks = locals.navLinks.concat(evergreenLinks)

  locals.footerLinks = [
    { label: 'Terms & Conditions', key: 'terms', href: '/terms' },
    { label: 'Privacy Policy', key: 'privacy', href: '/privacy' }
  ].concat(evergreenLinks)

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
