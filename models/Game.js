const keystone = require('keystone')
const Types = keystone.Field.Types

/**
 * Game Model
 * =============
 */

const Game = new keystone.List('Game')

Game.add({
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
  }
})

Game.defaultColumns = 'league, homeTeam, awayTeam, scheduledTime'
Game.register()
