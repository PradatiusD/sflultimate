const { Text, Url, DateTime, File } = require('@keystonejs/fields')
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
    type: Text,
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
  labelResolver: item => `${new Date(item.startTime).toLocaleDateString()}`,
  adminConfig: {
    defaultColumns: 'name, order, active, description, image'
  }
}
