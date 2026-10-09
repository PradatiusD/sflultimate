const { Text, Url, File, Checkbox, Integer } = require('@keystonejs/fields')
const CustomDateTime = require('../custom-fields/CustomDateTime')
const { Wysiwyg } = require('@keystonejs/fields-wysiwyg-tinymce')
const storage = require('./file-storage-adapter')

const fields = {
  name: {
    type: Text,
    isRequired: true
  },
  slug: {
    type: Text,
    initial: true
  },
  category: {
    type: Text,
    initial: true
  },
  startTime: {
    type: CustomDateTime,
    isRequired: true
  },
  endTime: {
    type: CustomDateTime,
    isRequired: true
  },
  location: {
    type: Text,
    isRequired: true
  },
  summary: {
    type: Wysiwyg
  },
  description: {
    type: Wysiwyg,
    isRequired: true
  },
  image: {
    type: File,
    adapter: storage
  },
  moreInformationUrl: {
    type: Url
  },
  allowRegistrations: {
    type: Checkbox,
    defaultValue: false,
    label: 'Allow registrations'
  },
  registrationPrice: {
    type: Integer,
    label: 'Registration price (USD)'
  }
}

module.exports = {
  fields,
  labelResolver: (item) => {
    const startTime = item.startTime ? new Date(item.startTime).toLocaleDateString() : ''
    return `${startTime} - ${item.name}`
  },
  adminConfig: {
    defaultColumns: 'name, startTime, endTime, active, description, image'
  }
}
