const { Text, Checkbox, Integer, Relationship, File, Select } = require('@keystonejs/fields')
const storage = require('./file-storage-adapter')

const fields = {
  title: {
    type: Text
  },
  gallery: {
    type: Relationship,
    ref: 'Gallery.assets'
  },
  file: {
    type: File,
    adapter: storage
  },
  assetType: {
    type: Select,
    options: [
      { value: 'image', label: 'Image' },
      { value: 'video', label: 'Video' }
    ]
  },
  caption: {
    type: Text
  },
  altText: {
    type: Text
  },
  credit: {
    type: Text
  },
  sortOrder: {
    type: Integer
  },
  isActive: {
    type: Checkbox
  }
}

module.exports = {
  fields,
  labelResolver: item => item.title || item.caption || 'Untitled Gallery Asset',
  adminConfig: {
    defaultColumns: 'title, gallery, assetType, sortOrder, isActive'
  }
}
