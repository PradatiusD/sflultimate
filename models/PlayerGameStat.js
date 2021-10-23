const keystone = require('keystone')
const Types = keystone.Field.Types

/**
 * PlayerGameStat Model
 * ==============
 */

const PlayerGameStat = new keystone.List('PlayerGameStat')
const fields = {
  createdAt: {
    type: Types.Date,
    initial: true,
    required: true
  },
  updatedAt: {
    type: Types.Date,
    initial: true,
    required: true
  },
  player: {
    type: Types.Relationship,
    ref: 'Player',
    index: true,
    initial: true
  },
  game: {
    type: Types.Relationship,
    ref: 'Game',
    index: true,
    initial: true
  },
  assists: {
    type: Types.Number,
    initial: true
  },
  scores: {
    type: Types.Number,
    initial: true
  },
  defenses: {
    type: Types.Number,
    initial: true
  },
  pointsPlayed: {
    type: Types.Number,
    initial: true
  }
}

PlayerGameStat.add(fields)

/**
 * Registration
 */

// PlayerGameStat.defaultColumns = 'name, email, gender, leagues'
PlayerGameStat.register()
