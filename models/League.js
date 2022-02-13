const keystone = require('keystone')
const Types = keystone.Field.Types

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
    type: Types.Text,
    initial: true,
    required: true,
    index: true
  },
  summary: {
    type: Types.Text
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
