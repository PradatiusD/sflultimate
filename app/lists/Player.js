const { Text, Relationship, DateTime, Integer, Checkbox, Select, Password } = require('@keystonejs/fields')

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
  gender: {
    type: Select,
    options: ['Male', 'Female', 'Other']
  },
  age: {
    type: Integer,
    isRequired: true
  },
  email: {
    type: Text,
    isRequired: true
  },
  password: {
    type: Password,
    isRequired: true
  },
  shirtSize: {
    type: Select,
    options: ['NA', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'].map(s => { return { value: s, label: s } })
  },
  skillLevel: {
    type: Select,
    options: [1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => { return { value: i, label: i.toString() } }),
    isRequired: true,
    dataType: 'integer'
  },
  participation: {
    type: Select,
    options: [30, 50, 80].map(i => { return { value: i, label: i.toString() } }),
    isRequired: false,
    dataType: 'integer'
  },
  registrationLevel: {
    type: Select,
    options: ['Student', 'Adult'],
    isRequired: true
  },
  leagues: {
    type: Relationship,
    ref: 'League',
    many: true
  },
  partnerName: {
    type: Text,
    isRequired: false
  },
  wouldCaptain: {
    type: Checkbox,
    isRequired: false
  },
  comments: {
    type: Text,
    isRequired: false
  },
  usauNumber: {
    type: Text,
    isRequired: false
  },
  phoneNumber: {
    type: Text,
    isRequired: false
  },
  wouldSponsor: {
    type: Checkbox,
    isRequired: false
  },
  willAttendFinals: {
    type: Checkbox,
    isRequired: false
  },
  preferredPositions: {
    type: Text
  }
}

// Player.add(fields, 'Permissions', {
//   isAdmin: {
//     type: Checkbox,
//     label: 'Can access Keystone',
//     index: true
//   }
// })
//
// // Provide access to Keystone
// Player.schema.virtual('canAccessKeystone').get(function () {
//   return this.isAdmin
// })

module.exports = {
  fields,
  labelResolver: member => member.firstName + ' ' + member.lastName,
  adminConfig: {
    defaultColumns: 'name, email, gender, leagues'
  }
}
