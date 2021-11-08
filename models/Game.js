const keystone = require('keystone')
const Types = keystone.Field.Types

/**
 * Game Model
 * =============
 */

const Game = new keystone.List('Game')

Game.add({
  name: {
    type: String
  },
  league: {
    type: Types.Relationship,
    ref: 'League',
    index: true,
    initial: true
  },
  scheduledTime: {
    type: Types.Datetime,
    initial: true
  },
  homeTeam: {
    type: Types.Relationship,
    ref: 'Team',
    index: true,
    initial: true
  },
  awayTeam: {
    type: Types.Relationship,
    ref: 'Team',
    index: true,
    initial: true
  },
  homeTeamScore: {
    type: Types.Number
  },
  awayTeamScore: {
    type: Types.Number
  },
  location: {
    type: Types.Relationship,
    ref: 'Location',
    initial: true
  }
})

Game.schema.pre('save', async function (next) {
  const Team = keystone.list('Team')
  const [month, day, year] = this.scheduledTime.toLocaleDateString('en-US', { timeZone: 'America/New_York' }).split('/')
  const results = await Team.model.find({
    _id: {
      $in: [this.homeTeam, this.awayTeam]
    }
  })

  if (results.length === 2) {
    const firstIsAwayTeam = this.awayTeam.equals(results[0]._id)
    const awayTeam = firstIsAwayTeam ? results[0] : results[1]
    const homeTeam = firstIsAwayTeam ? results[1] : results[0]
    this.name = [year, month, day].join('') + '_' + awayTeam.name + '@' + homeTeam.name
  }
  next()
})

Game.defaultColumns = 'league, homeTeam, homeTeamScore, awayTeam, awayTeamScore, scheduledTime'
Game.register()
