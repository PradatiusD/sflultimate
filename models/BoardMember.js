const keystone = require('keystone')
const Types = keystone.Field.Types
const storage = require('./file-storage-adapter')

/**
 * Board Position Model
 * ==============
 */

const BoardMember = new keystone.List('BoardMember')

const fields = {
  name: {
    type: Types.Name,
    initial: true,
    required: true
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
    initial: true,
    required: true
  },
  image: {
    type: Types.File,
    storage: storage
  }
}

BoardMember.add(fields)

/**
 * Registration
 */

BoardMember.defaultColumns = 'name, order, active, description, image'
BoardMember.register()
