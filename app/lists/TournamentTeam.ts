const { Text, Select, File } = require('@keystonejs/fields')
const { Color } = require('@keystonejs/fields-color')
const storage = require('./file-storage-adapter')

const fields = {
  name: {
    type: Text,
    isRequired: true,
    index: true
  },
  color: {
    type: Color
  },
  email: {
    type: Text
  },
  captainNames: {
    type: Text,
    isRequired: true,
    index: true
  },
  locationName: {
    type: Text,
    isRequired: true,
    index: true
  },
  competitionName: {
    type: Select,
    options: ['Pro', 'Club', 'Recreation'],
    isRequired: true
  },
  image: {
    type: File,
    adapter: storage
  }
}

module.exports = {
  fields,
  adminConfig: {
    defaultColumns: 'name, captainNames, locationName, competitionName'
  }
}
