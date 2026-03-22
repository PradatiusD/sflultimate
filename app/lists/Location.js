const { Text, Url } = require('@keystonejs/fields')
const fields = {
  name: {
    type: Text,
    initial: true,
    required: true,
    index: true
  },
  mapsLocationUrl: {
    type: Url
  }
}

module.exports = {
  fields,
  labelResolver: item => item.name,
  adminConfig: {
    defaultColumns: 'name'
  }
}
