const { Relationship, DateTime, Integer, Checkbox } = require('@keystonejs/fields')

/**
 * PlayerGameStat Model
 * ==============
 */

const fields = {
  createdAt: {
    type: DateTime,
    initial: true,
    required: true
  },
  updatedAt: {
    type: DateTime,
    initial: true,
    required: true
  },
  player: {
    type: Relationship,
    ref: 'Player',
    required: true,
    index: true,
    initial: true
  },
  game: {
    type: Relationship,
    ref: 'Game',
    required: true,
    index: true,
    initial: true
  },
  assists: {
    type: Integer,
    initial: true
  },
  scores: {
    type: Integer,
    initial: true
  },
  defenses: {
    type: Integer,
    initial: true
  },
  throwaways: {
    type: Integer,
    initial: true
  },
  drops: {
    type: Integer,
    initial: true
  },
  pointsPlayed: {
    type: Integer,
    initial: true
  },
  attended: {
    type: Checkbox,
    initial: true
  }
}

module.exports = {
  fields,
  labelResolver: member => member.firstName + ' ' + member.lastName,
  adminConfig: {
    defaultColumns: 'player, game, assists, scores, defenses, pointsPlayed'
  }
}
