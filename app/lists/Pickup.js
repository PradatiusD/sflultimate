const { Text, Integer, Checkbox, DateTime, Relationship } = require('@keystonejs/fields')

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
  isFeaturedOnHomepage: {
    type: Checkbox,
    default: false,
    label: 'Featured on Homepage'
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
  },
  location: {
    type: Relationship,
    ref: 'Location',
    initial: true
  }
}

module.exports = {
  fields,
  labelResolver: item => item.title,
  adminConfig: {
    defaultColumns: 'isActive, isFeaturedOnHomepage, order, title, locationName, day, time, locationType'
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
