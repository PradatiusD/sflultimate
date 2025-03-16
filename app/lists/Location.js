const { Text } = require('@keystonejs/fields')
const fields = {
  name: {
    type: Text,
    initial: true,
    required: true,
    index: true
  }
}

module.exports = {
  fields,
  labelResolver: item => item.name,
  adminConfig: {
    defaultColumns: 'name'
  }
}
