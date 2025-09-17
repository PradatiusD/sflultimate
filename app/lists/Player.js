const { Text, Relationship, DateTime, Integer, Checkbox, Select } = require('@keystonejs/fields')
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
    options: ['Male', 'Female', 'Other'],
    isRequired: true
  },
  age: {
    type: Integer,
    isRequired: true
  },
  email: {
    type: Text,
    isRequired: true
  },
  shirtSize: {
    type: Select,
    options: ['NA', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'].map(s => { return { value: s, label: s } })
  },
  skillLevel: {
    type: Select,
    options: [1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => { return { value: i, label: i.toString() } }),
    isRequired: false,
    dataType: 'integer'
  },
  athleticismLevel: {
    type: Select,
    options: [1, 2, 3, 4, 5].map(i => { return { value: i, label: i.toString() } }),
    dataType: 'integer'
  },
  experienceLevel: {
    type: Select,
    options: [1, 2, 3, 4, 5].map(i => { return { value: i, label: i.toString() } }),
    dataType: 'integer'
  },
  throwsLevel: {
    type: Select,
    options: [1, 2, 3, 4, 5].map(i => { return { value: i, label: i.toString() } }),
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
  donationAmount: {
    type: Integer
  },
  preferredPositions: {
    type: Text
  }
}

module.exports = {
  fields,
  labelResolver: (player) => {
    const date = new Date(parseInt(player.id.substring(0, 8), 16) * 1000)
    const year = date.getFullYear().toString().substring(2, 4)
    const month = date.getMonth() + 1
    return `${player.firstName} ${player.lastName} (${month}/${year})`
  },
  adminConfig: {
    defaultColumns: 'firstName, lastName, email, gender, leagues'
  }
}
