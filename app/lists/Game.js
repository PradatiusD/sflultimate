const { Text, Integer, Checkbox, Relationship } = require('@keystonejs/fields')
const CustomDateTime = require('../custom-fields/CustomDateTime')

const fields = {
  name: {
    type: Text
  },
  league: {
    type: Relationship,
    ref: 'League',
    index: true,
    initial: true,
    required: true
  },
  scheduledTime: {
    type: CustomDateTime,
    initial: true
  },
  homeTeam: {
    type: Relationship,
    ref: 'Team',
    index: true,
    initial: true
  },
  awayTeam: {
    type: Relationship,
    ref: 'Team',
    index: true,
    initial: true
  },
  homeTeamScore: {
    type: Integer
  },
  homeTeamForfeit: {
    type: Checkbox,
    default: false
  },
  awayTeamScore: {
    type: Integer
  },
  awayTeamForfeit: {
    type: Checkbox,
    default: false
  },
  location: {
    type: Relationship,
    ref: 'Location',
    initial: true
  },
  showNameOnSchedule: {
    type: Checkbox,
    default: false
  }
}

// Game.schema.pre('save', async function (next) {
//   const Team = keystone.list('Team')
//   const [month, day, year] = this.scheduledTime.toLocaleDateString('en-US', { timeZone: 'America/New_York' }).split('/')
//   const results = await Team.model.find({
//     _id: {
//       $in: [this.homeTeam, this.awayTeam]
//     }
//   })
//
//   if (results.length === 2) {
//     const firstIsAwayTeam = this.awayTeam.equals(results[0]._id)
//     const awayTeam = firstIsAwayTeam ? results[0] : results[1]
//     const homeTeam = firstIsAwayTeam ? results[1] : results[0]
//     this.name = [year, month.padStart(2, '0'), day.padStart(2, '0')].join('') + '_' + awayTeam.name + '@' + homeTeam.name
//   }
//   next()
// })
//
//
// Game.register()

module.exports = {
  fields,
  adminConfig: {
    defaultColumns: 'league, homeTeam, homeTeamScore, awayTeam, awayTeamScore, scheduledTime, location'
  }
}
