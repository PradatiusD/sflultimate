// Simulate config options from your production environment by
// customising the .env file in your project's root folder.
require('dotenv').load()

// Require keystone
const keystone = require('keystone')

/*
 * Keystone Configuration
 * --------------------------
 * Initialise Keystone with your project's configuration.
 * See http://keystonejs.com/guide/config for available options
 * and documentation.
 */

const keystoneConfig = {
  name: 'SFLUltimate',
  brand: 'SFLUltimate',

  sass: 'public',
  static: 'public',
  favicon: 'public/favicon.ico',
  views: 'templates/views',
  'view engine': 'jade',

  emails: 'templates/emails',
  mongo: process.env.MONGOLAB_URI,

  'auto update': true,
  session: true,
  auth: true,
  'user model': 'Player'
}

keystone.init(keystoneConfig)

// Load your project's Models
keystone.import('models')

// Setup common locals for your templates. The following are required for the
// bundled templates and layouts. Any runtime locals (that should be set uniquely
// for each request) should be added to ./routes/middleware.js

keystone.set('locals', {
  _: require('underscore'),
  env: keystone.get('env'),
  utils: keystone.utils,
  editable: keystone.content.editable
})

keystone.set('isRegistrationPeriod', false
  // {
  // mode: 'league' // 'tournament
// }
)

// Load your project's Routes
keystone.set('routes', require('./routes'))

// Setup common locals for your emails. The following are required by Keystone's
// default email templates, you may remove them if you're using your own.

keystone.set('email locals', {
  logo_src: '/images/logo-email.gif',
  logo_width: 194,
  logo_height: 76,
  theme: {
    email_bg: '#f9f9f9',
    link_color: '#2697de',
    buttons: {
      color: '#fff',
      background_color: '#2697de',
      border_color: '#1a7cb7'
    }
  }
})

// Configure the navigation bar in Keystone's Admin UI

keystone.set('nav', {
  Content: ['posts', 'post-categories'],
  League: ['leagues', 'teams', 'games', 'players', 'player-game-stats'],
  Pickup: ['pickups']
})

// Configure Web Server
keystone.set('port', process.env.PORT || 5000)

// Start Keystone to connect to your database and initialise the web server
keystone.start()

async function updatePrimaryUserPassword () {
  const Player = keystone.list('Player')
  const player = await Player.model.findOne({
    email: process.env.KEYSTONE_USERNAME
  })
  player.isAdmin = true
  player.password = process.env.KEYSTONE_PASSWORD
  return player.save()
}

updatePrimaryUserPassword()
  .then(function () {})
  .catch(console.error)
