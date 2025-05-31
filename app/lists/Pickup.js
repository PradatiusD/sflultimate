const { Text, Integer, Float, Select, Checkbox, Relationship, File } = require('@keystonejs/fields')

const fields = {
  title: {
    type: Text,
    initial: true,
    required: true,
    index: true,
    label: 'Pickup Name'
  },
  isActive: {
    type: Checkbox,
    default: false
  },
  order: {
    type: Integer,
    isRequired: true
  },
  day: {
    type: Text,
    initial: true,
    required: true,
    label: 'Day(s) Played'
  },
  time: {
    type: Text,
    initial: true,
    required: true,
    label: 'Start Time'
  },
  contactName: {
    type: Text,
    initial: true
  },
  contactEmail: {
    type: Text,
    initial: true
  },
  contactPhone: {
    type: Text,
    initial: true
  },
  contactUrl: {
    type: Text,
    initial: true,
    label: 'Contact URL'
  },
  contactWhatsapp: {
    type: Text,
    initial: true,
    label: 'WhatsApp Group URL'
  },
  locationName: {
    type: Text,
    initial: true,
    required: true
  },
  locationType: {
    type: Select,
    options: ['grass', 'turf', 'beach', 'indoor'],
    initial: true,
    required: true,
    label: 'Field Type'
  },
  locationAddressStreet: {
    type: Text,
    initial: true,
    required: true,
    label: 'Street Address'
  },
  locationAddressCity: {
    type: Text,
    initial: true,
    required: true,
    label: 'City'
  },
  locationAddressState: {
    type: Text,
    initial: true,
    required: true,
    label: 'State'
  },
  locationAddressZipCode: {
    type: Integer,
    initial: true,
    required: true,
    label: 'Zip Code'
  },
  locationLatitude: {
    type: Float,
    initial: false,
    required: false,
    label: 'Latitude'
  },
  locationLongitude: {
    type: Float,
    initial: false,
    required: false,
    label: 'Longitude'
  },
  description: {
    type: Text,
    initial: true,
    required: true
  }
}

module.exports = {
  fields,
  labelResolver: item => item.title,
  adminConfig: {
    defaultColumns: 'isActive, order, title, locationName, day, time, locationType'
  }
}
