const keystone = require('keystone')
const storage = require('./file-storage-adapter')
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
  numberOfWeeksOfPlay: {
    type: Types.Number,
    initial: false,
    required: false
  },
  earlyRegistrationStart: {
    type: Types.Datetime
  },
  earlyRegistrationEnd: {
    type: Types.Datetime
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
  'pricing.earlyStudent': {
    type: Types.Number,
    initial: true,
    required: true,
    default: 30
  },
  'pricing.earlyAdult': {
    type: Types.Number,
    initial: true,
    required: true,
    default: 55
  },
  'pricing.regularStudent': {
    type: Types.Number,
    initial: true,
    required: true,
    default: 30
  },
  'pricing.regularAdult': {
    type: Types.Number,
    initial: true,
    required: true,
    default: 55
  },
  'pricing.lateAdult': {
    type: Types.Number,
    initial: true,
    required: true,
    default: 55
  },
  'pricing.lateStudent': {
    type: Types.Number,
    initial: true,
    required: true,
    default: 55
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
  },
  jerseyDesign: {
    type: Types.File,
    storage: storage
  },
  registrationShareImage: {
    type: Types.File,
    storage: storage
  },
  requestAttendance: {
    type: Types.Boolean
  },
  requestShirtSize: {
    type: Types.Boolean
  },
  requestSponsorship: {
    type: Types.Boolean
  }
})

League.defaultColumns = 'title, isActive, registrationStart, registrationEnd'
League.register()
