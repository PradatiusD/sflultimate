const { Text, Checkbox, Integer, Relationship, File } = require('@keystonejs/fields')
const CustomDateTime = require('../custom-fields/CustomDateTime')
const { Wysiwyg } = require('@keystonejs/fields-wysiwyg-tinymce')
const storage = require('./file-storage-adapter')

const fields = {
  title: {
    type: Text,
    initial: true,
    required: true,
    index: true
  },
  summary: {
    type: Text
  },
  description: {
    type: Wysiwyg,
    wysiwyg: true
  },
  isActive: {
    type: Checkbox,
    default: false
  },
  numberOfWeeksOfPlay: {
    type: Integer,
    initial: false,
    required: false
  },
  earlyRegistrationStart: {
    type: CustomDateTime
  },
  earlyRegistrationEnd: {
    type: CustomDateTime
  },
  registrationStart: {
    type: CustomDateTime
  },
  registrationEnd: {
    type: CustomDateTime
  },
  lateRegistrationStart: {
    type: CustomDateTime
  },
  lateRegistrationEnd: {
    type: CustomDateTime
  },
  pricingEarlyStudent: {
    type: Integer,
    initial: true,
    required: true,
    default: 30
  },
  pricingEarlyAdult: {
    type: Integer,
    initial: true,
    required: true,
    default: 55
  },
  pricingRegularStudent: {
    type: Integer,
    initial: true,
    required: true,
    default: 30
  },
  pricingRegularAdult: {
    type: Integer,
    initial: true,
    required: true,
    default: 55
  },
  pricingLateAdult: {
    type: Integer,
    initial: true,
    required: true,
    default: 55
  },
  pricingLateStudent: {
    type: Integer,
    initial: true,
    required: true,
    default: 55
  },
  finalsTournamentStartDate: {
    type: CustomDateTime
  },
  finalsTournamentEndDate: {
    type: CustomDateTime
  },
  finalsTournamentDescription: {
    type: Wysiwyg,
    wysiwyg: true
  },
  finalsTournamentLocation: {
    type: Relationship,
    ref: 'Location'
  },
  jerseyDesign: {
    type: File,
    adapter: storage
  },
  registrationShareImage: {
    type: File,
    adapter: storage
  },
  requestAttendance: {
    type: Checkbox
  },
  requestShirtSize: {
    type: Checkbox
  },
  requestSponsorship: {
    type: Checkbox
  }
}

module.exports = {
  fields,
  labelResolver: item => item.title,
  adminConfig: {
    defaultColumns: 'title, isActive, registrationStart, registrationEnd'
  }
}
