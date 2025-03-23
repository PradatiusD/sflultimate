const { Text, Url, DateTime, File } = require('@keystonejs/fields')
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
    type: DateTime,
    isRequired: true,
    format: 'dd/MM/yyyy HH:mm O'
  },
  endTime: {
    type: DateTime,
    isRequired: true,
    format: 'dd/MM/yyyy HH:mm O'
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
    defaultColumns: 'name, order, active, description, image'
  }
}
