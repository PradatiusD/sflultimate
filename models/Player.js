var keystone = require('keystone');
var Types = keystone.Field.Types;

/**
 * Player Model
 * ==========
 */

var Player = new keystone.List('Player');

var fields = {
  name: { 
    type: Types.Name, 
    required: true, 
    index: true 
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
    initial: true,
    required: true
  },
  registered: {
    type: Types.Boolean,
    required: true,
    default: false
  }
};

Player.add(fields, 'Permissions', {
  isAdmin: { 
    type: Boolean,
    label: 'Can access Keystone',
    index: true
  }
});

// Provide access to Keystone
Player.schema.virtual('canAccessKeystone').get(function() {
  return this.isAdmin;
});


/**
 * Relationships
 */

Player.relationship({ ref: 'Post', path: 'posts', refPath: 'author' });


/**
 * Registration
 */

Player.defaultColumns = 'name, email, isAdmin';
Player.register();
