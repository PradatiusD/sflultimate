const keystone = require('keystone')

module.exports = function (req, res) {
  const view = new keystone.View(req, res)
  res.locals.teams = [
    {
      'Team Name': 'Birthday Suit',
      'Captain Name': 'Mark S.',
      'Team Hometown': 'St. Petersburg, FL',
      'Competitive Level': 'Club',
      in_state: true
    },
    {
      'Team Name': 'Party Wave',
      'Captain Name': 'Andrea J.',
      'Team Hometown': 'Miami, FL',
      'Competitive Level': 'Pro',
      in_state: true
    },
    {
      'Team Name': 'Tbd',
      'Captain Name': 'Lucas A.',
      'Team Hometown': 'Weston, FL',
      'Competitive Level': 'Club',
      in_state: true
    },
    {
      'Team Name': 'Party B',
      'Captain Name': 'Megan B.',
      'Team Hometown': 'Fort Lauderdale, FL',
      'Competitive Level': 'Club',
      in_state: true
    },
    {
      'Team Name': 'Savage',
      'Captain Name': 'Lina F.',
      'Team Hometown': 'Miami, FL & West Palm Beach, FL',
      'Competitive Level': 'Club',
      in_state: true
    },
    {
      'Team Name': 'Dumb Beaches',
      'Captain Name': 'Bryan R.',
      'Team Hometown': 'Melbourne, FL',
      'Competitive Level': 'Club',
      in_state: true
    },
    {
      'Team Name': 'Latin Power',
      'Captain Name': 'Daniel Z.',
      'Team Hometown': 'Fort Myers, FL',
      'Competitive Level': 'Club',
      in_state: true
    },
    {
      'Team Name': 'SOUP Szn',
      'Captain Name': 'Xin Xin T.',
      'Team Hometown': 'Hershey, PA',
      'Competitive Level': 'Club',
      in_state: false
    },
    {
      'Team Name': 'Sky’s out Thighs out',
      'Captain Name': 'Chris S.',
      'Team Hometown': 'Jacksonville',
      'Competitive Level': 'Club',
      in_state: true
    },
    {
      'Team Name': 'Unicorn Country',
      'Captain Name': 'Torre S.',
      'Team Hometown': 'Scranton, PA',
      'Competitive Level': 'College',
      in_state: false
    },
    {
      'Team Name': 'Latin Power',
      'Captain Name': 'Daren',
      'Team Hometown': 'Florida',
      'Competitive Level': 'Club',
      in_state: true
    }
  ].map(function (event) {
    return event
  }).sort(function (a, b) {
    return a['Team Name'].localeCompare(b['Team Name'])
  })

  view.render('beach-bash-tournament')
}
