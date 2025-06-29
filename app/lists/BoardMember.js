const storage = require('./file-storage-adapter')
const { Text, Integer, Checkbox, File } = require('@keystonejs/fields')

/**
 * Board Member Modal
 * ==============
 */
const fields = {
  firstName: {
    type: Text,
    isRequired: true
  },
  lastName: {
    type: Text,
    isRequired: true
  },
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
  adminConfig: {
    defaultColumns: 'name, order, active, description, image'
  },
  labelResolver: member => member.firstName + ' ' + member.lastName
}
