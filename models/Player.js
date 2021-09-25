var keystone = require('keystone')
var Types = keystone.Field.Types

/**
 * Player Model
 * ==============
 */

var Player = new keystone.List('Player')

var fields = {
  name: {
    type: Types.Name,
    initial: true,
    required: true,
    index: true
  },
  gender: {
    type: Types.Select,
    options: ['Male', 'Female'],
    initial: true
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
    options: 'S, M, L, XL, XXL, XXXL',
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
  ageGroup: {
    type: Types.Select,
    options: ['Student', 'Adult'],
    initial: true,
    required: true
  },
  registered: {
    type: Types.Boolean,
    default: false
  },
  partner: {
    type: Types.Relationship,
    ref: 'Player'
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

Player.defaultColumns = 'name, email, isAdmin, registered'
Player.register()
