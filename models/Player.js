const keystone = require('keystone')
const Types = keystone.Field.Types

/**
 * Player Model
 * ==============
 */

const Player = new keystone.List('Player')

const fields = {
  createdAt: {
    type: Types.Date,
    initial: true,
    required: true
  },
  updatedAt: {
    type: Types.Date,
    initial: true,
    required: true
  },
  name: {
    type: Types.Name,
    initial: true,
    required: true,
    index: true
  },
  gender: {
    type: Types.Select,
    options: ['Male', 'Female', 'Other'],
    initial: true
  },
  age: {
    type: Number,
    initial: true,
    required: true
  },
  email: {
    type: Types.Email,
    initial: true,
    required: true,
    index: true
  },
  password: {
    type: Types.Password,
    initial: true,
    required: true
  },
  shirtSize: {
    type: Types.Select,
    options: 'NA, XS, S, M, L, XL, XXL, XXXL',
    initial: true
  },
  skillLevel: {
    type: Types.Select,
    options: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    initial: true,
    required: true
  },
  participation: {
    type: Types.Select,
    options: [30, 50, 80],
    initial: true,
    required: true
  },
  registrationLevel: {
    type: Types.Select,
    options: ['Student', 'Adult'],
    initial: true,
    required: true
  },
  leagues: {
    type: Types.Relationship,
    ref: 'League',
    many: true
  },
  partnerName: {
    type: String,
    initial: true,
    required: false
  },
  wouldCaptain: {
    type: Boolean,
    initial: true,
    required: false
  },
  comments: {
    type: String,
    initial: true,
    required: false
  },
  usauNumber: {
    type: String,
    initial: true,
    required: false
  },
  phoneNumber: {
    type: String,
    initial: false,
    required: false
  },
  wouldSponsor: {
    type: Boolean,
    initial: true,
    required: false
  }
}

Player.add(fields, 'Permissions', {
  isAdmin: {
    type: Boolean,
    label: 'Can access Keystone',
    index: true
  }
})

// Provide access to Keystone
Player.schema.virtual('canAccessKeystone').get(function () {
  return this.isAdmin
})

/**
 * Registration
 */

Player.defaultColumns = 'name, email, gender, leagues'
Player.register()
