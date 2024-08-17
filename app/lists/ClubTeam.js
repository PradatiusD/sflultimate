const storage = require('./file-storage-adapter')
const { Text, Url, Select, Integer, Checkbox, File } = require('@keystonejs/fields')

const fields = {
  name: {
    type: Text,
    isRequired: true
  },
  category: {
    type: Select,
    options: [
      'Mixed',
      'Open',
      'Women',
      'College - Women',
      'College - Mixed',
      'College - Open'
    ],
    dataType: 'string'
  },
  order: {
    type: Integer,
    isRequired: true
  },
  active: {
    type: Checkbox,
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
  instagramPageUrl: {
    type: Url
  },
  facebookPageUrl: {
    type: Url
  },
  websiteUrl: {
    type: Url
  },
  twitterPageUrl: {
    type: Url
  },
  interestFormPageUrl: {
    type: Url
  }
}

module.exports = {
  fields,
  adminConfig: {
    defaultColumns: 'name, order, active, description, image'
  }

}
