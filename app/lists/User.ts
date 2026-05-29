const { Text, Password } = require('@keystonejs/fields')

const fields = {
  firstName: {
    type: Text,
    isRequired: true
  },
  lastName: {
    type: Text,
    isRequired: true
  },
  email: {
    type: Text,
    isRequired: true
  },
  password: {
    type: Password,
    isRequired: true
  }
}

module.exports = {
  fields,
  labelResolver: user => user.firstName + ' ' + user.lastName,
  defaultColumns: 'firstName, lastName, email'
}
