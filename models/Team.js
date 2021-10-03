const keystone = require('keystone')
const Types = keystone.Field.Types

/**
 * Team Model
 * =============
 */

const Team = new keystone.List('Team')

Team.add({
  name: {
    type: String,
    initial: true,
    required: true,
    index: true
  },
  color: {
    type: Types.Color,
    initial: true
  },
  captains: {
    type: Types.Relationship,
    ref: 'Player',
    initial: true,
    many: true
  },
  players: {
    type: Types.Relationship,
    ref: 'Player',
    initial: true,
    many: true
  },
  league: {
    type: Types.Relationship,
    ref: 'League',
    initial: true
  }
})

Team.defaultColumns = 'name, league, captains, color'

Team.register()
