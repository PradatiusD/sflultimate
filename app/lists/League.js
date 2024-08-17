const { Text, DateTime, Checkbox, Integer, Relationship, File } = require('@keystonejs/fields')
const { Wysiwyg } = require('@keystonejs/fields-wysiwyg-tinymce');
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
    type: DateTime
  },
  earlyRegistrationEnd: {
    type: DateTime
  },
  registrationStart: {
    type: DateTime
  },
  registrationEnd: {
    type: DateTime
  },
  lateRegistrationStart: {
    type: DateTime
  },
  lateRegistrationEnd: {
    type: DateTime
  },
  // 'pricing.earlyStudent': {
  //   type: Integer,
  //   initial: true,
  //   required: true,
  //   default: 30
  // },
  // 'pricing.earlyAdult': {
  //   type: Integer,
  //   initial: true,
  //   required: true,
  //   default: 55
  // },
  // 'pricing.regularStudent': {
  //   type: Integer,
  //   initial: true,
  //   required: true,
  //   default: 30
  // },
  // 'pricing.regularAdult': {
  //   type: Integer,
  //   initial: true,
  //   required: true,
  //   default: 55
  // },
  // 'pricing.lateAdult': {
  //   type: Integer,
  //   initial: true,
  //   required: true,
  //   default: 55
  // },
  // 'pricing.lateStudent': {
  //   type: Integer,
  //   initial: true,
  //   required: true,
  //   default: 55
  // },
  // 'finalsTournament.startDate': {
  //   type: DateTime
  // },
  // 'finalsTournament.endDate': {
  //   type: DateTime
  // },
  // 'finalsTournament.description': {
  //   type: Wysiwyg,
  //   wysiwyg: true
  // },
  // 'finalsTournament.location': {
  //   type: Relationship,
  //   ref: 'Location'
  // },
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
