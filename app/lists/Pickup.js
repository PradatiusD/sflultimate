const { Text, Integer, Float, Select, Checkbox, DateTime } = require('@keystonejs/fields')

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
    isRequired: true,
    label: 'Day(s) Played'
  },
  time: {
    type: Text,
    initial: true,
    isRequired: true,
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
    isRequired: true
  },
  locationType: {
    type: Select,
    options: ['grass', 'turf', 'beach', 'indoor'],
    initial: true,
    isRequired: true,
    label: 'Field Type'
  },
  locationAddressStreet: {
    type: Text,
    initial: true,
    isRequired: true,
    label: 'Street Address'
  },
  locationAddressCity: {
    type: Text,
    initial: true,
    isRequired: true,
    label: 'City'
  },
  locationAddressState: {
    type: Text,
    initial: true,
    isRequired: true,
    label: 'State'
  },
  locationAddressZipCode: {
    type: Integer,
    initial: true,
    isRequired: true,
    label: 'Zip Code'
  },
  locationLatitude: {
    type: Float,
    initial: false,
    isRequired: false,
    label: 'Latitude'
  },
  locationLongitude: {
    type: Float,
    initial: false,
    isRequired: false,
    label: 'Longitude'
  },
  description: {
    type: Text,
    initial: true,
    isRequired: true
  },
  updatedAt: {
    type: DateTime,
    initial: false,
    isRequired: false,
    defaultValue: () => new Date().toISOString(),
    adminConfig: {
      isReadOnly: true
    }
  },
  slug: {
    type: Text,
    initial: true,
    isRequired: true
  }
}

module.exports = {
  fields,
  labelResolver: item => item.title,
  adminConfig: {
    defaultColumns: 'isActive, order, title, locationName, day, time, locationType'
  },
  hooks: {
    resolveInput: ({ resolvedData, existingItem, context }) => {
      // On update (existingItem != undefined), set updatedAt
      if (existingItem) {
        resolvedData.updatedAt = new Date().toISOString()
      }
      return resolvedData
    }
  }
}
