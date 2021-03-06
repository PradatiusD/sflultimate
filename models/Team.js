const keystone = require('keystone')
const Types = keystone.Field.Types

/**
 * Team Model
 * =============
 */

const Team = new keystone.List('Team', {
  map: {
    name: 'name'
  }
})

Team.add({
  name: {
    type: String,
    initial: true,
    required: true,
    index: true
  },
  color: {
    type: Types.Color
  },
  captains: {
    type: Types.Relationship,
    initial: true,
    ref: 'Player',
    many: true
  },
  players: {
    type: Types.Relationship,
    ref: 'Player',
    many: true
  },
  league: {
    type: Types.Relationship,
    ref: 'League'
  }
})

Team.defaultColumns = 'color, name, captains, league'

Team.register()
