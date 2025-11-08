const { Text, Url, File } = require('@keystonejs/fields')
const CustomDateTime = require('../custom-fields/CustomDateTime')
const { Wysiwyg } = require('@keystonejs/fields-wysiwyg-tinymce')
const storage = require('./file-storage-adapter')

const fields = {
  name: {
    type: Text,
    isRequired: true
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
