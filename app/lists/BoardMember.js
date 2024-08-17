const storage = require('./file-storage-adapter')
const { Text, Integer, Checkbox, File } = require('@keystonejs/fields')

/**
 * Board Position Model
 * ==============
 */
// TODO: Migrate boardMember name
const fields = {
  // 'name.first': {
  //   type: Text,
  //   isRequired: true
  // },
  // 'name.last': {
  //   type: Text,
  //   isRequired: true
  // },
  order: {
    type: Integer,
    isRequired: true
  },
  active: {
    type: Checkbox,
    isRequired: true
  },
  description: {
    type: Text,
    required: true
  },
  image: {
    type: File,
    adapter: storage
  }
}

module.exports = {
  fields,
  labelResolver: item => `${item.name.first} ${item.name.last}`
}

// BoardMember.defaultColumns = 'name, order, active, description, image'
