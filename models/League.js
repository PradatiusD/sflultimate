var keystone = require('keystone')
var Types = keystone.Field.Types

/**
 * League Model
 * =============
 */
const League = new keystone.List('League', {
  map: {
    name: 'title'
  }
})

League.add({
  title: {
    type: String,
    initial: true,
    required: true,
    index: true
  },
  description: {
    type: Types.Html,
    wysiwyg: true
  },
  isActive: {
    type: Types.Boolean,
    default: false
  },
  registrationStart: {
    type: Types.Datetime
  },
  registrationEnd: {
    type: Types.Datetime
  },
  lateRegistrationStart: {
    type: Types.Datetime
  },
  lateRegistrationEnd: {
    type: Types.Datetime
  }
})

League.defaultColumns = 'title, isActive'
League.register()
