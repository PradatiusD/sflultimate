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
  },
  'pricing.regularStudent': {
    type: Types.Number,
    required: true
  },
  'pricing.regularAdult': {
    type: Types.Number,
    required: true
  },
  'pricing.lateAdult': {
    type: Types.Number,
    required: true
  },
  'pricing.lateStudent': {
    type: Types.Number,
    required: true
  },
  'finalsTournament.startDate': {
    type: Types.Datetime
  },
  'finalsTournament.endDate': {
    type: Types.Datetime
  },
  'finalsTournament.description': {
    type: Types.Html,
    wysiwyg: true
  },
  'finalsTournament.location': {
    type: Types.Relationship,
    ref: 'Location'
  }
})

League.defaultColumns = 'title, isActive, registrationStart, registrationEnd'
League.register()
