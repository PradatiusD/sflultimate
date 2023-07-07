const keystone = require('keystone')
const Types = keystone.Field.Types

/**
 * Board Position Model
 * ==============
 */

const BoardPosition = new keystone.List('BoardPosition', {
  map: {
    name: 'title'
  }
})

const fields = {
  title: {
    type: String,
    required: true,
    initial: true
  },
  order: {
    type: Types.Number,
    initial: true,
    required: true
  },
  active: {
    type: Types.Boolean,
    required: true,
    initial: true
  },
  description: {
    type: String,
    required: true,
    initial: true
  },
  commitment: {
    type: String,
    required: true,
    initial: true
  },
  assigned: {
    type: Types.Relationship,
    ref: 'BoardMember',
    initial: true,
    many: true
  }
}

BoardPosition.add(fields)

/**
 * Registration
 */

BoardPosition.defaultColumns = 'title, description, commitment, assigned'
BoardPosition.register()
