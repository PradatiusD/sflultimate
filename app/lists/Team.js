const { Text, Relationship } = require('@keystonejs/fields')
const { Color } = require('@keystonejs/fields-color')

const fields = {
  name: {
    type: Text,
    isRequired: true,
    index: true
  },
  color: {
    type: Color
  },
  captains: {
    type: Relationship,
    ref: 'Player',
    many: true
  },
  players: {
    type: Relationship,
    ref: 'Player',
    many: true
  },
  league: {
    type: Relationship,
    ref: 'League',
    initial: true
  }
}

module.exports = {
  fields,
  adminConfig: {
    defaultColumns: 'name, league, captains, color'
  }
}
