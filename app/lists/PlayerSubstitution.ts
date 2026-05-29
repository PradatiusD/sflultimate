const { Text, Relationship, DateTime, Select } = require('@keystonejs/fields')
const fields = {
  createdAt: {
    type: DateTime,
    isRequired: true
  },
  updatedAt: {
    type: DateTime,
    isRequired: true
  },
  firstName: {
    type: Text,
    isRequired: true
  },
  lastName: {
    type: Text,
    isRequired: true
  },
  name: {
    type: Text,
    isRequired: true
  },
  gender: {
    type: Select,
    options: ['Male', 'Female', 'Other'],
    isRequired: true
  },
  email: {
    type: Text,
    isRequired: true
  },
  league: {
    type: Relationship,
    ref: 'League',
    many: false
  },
  team: {
    type: Relationship,
    ref: 'Team',
    many: false
  },
  comments: {
    type: Text,
    isRequired: false
  },
  phoneNumber: {
    type: Text,
    isRequired: false
  }
}

module.exports = {
  fields,
  adminConfig: {
    defaultColumns: 'nmae, email, gender, league'
  }
}
