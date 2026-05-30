const { Text, Checkbox, Integer, Relationship, File } = require('@keystonejs/fields')
const { Wysiwyg } = require('@keystonejs/fields-wysiwyg-tinymce')
const storage = require('./file-storage-adapter')
const GalleryAssetsManager = require('../custom-fields/GalleryAssetsManager')

const fields = {
  title: {
    type: Text,
    index: true
  },
  slug: {
    type: Text,
    index: true
  },
  summary: {
    type: Text
  },
  description: {
    type: Wysiwyg
  },
  coverImage: {
    type: File,
    adapter: storage
  },
  eventDateLabel: {
    type: Text
  },
  sortOrder: {
    type: Integer
  },
  isActive: {
    type: Checkbox
  },
  assets: {
    type: Relationship,
    ref: 'GalleryAsset.gallery',
    many: true
  },
  assetManager: {
    type: GalleryAssetsManager,
    adminDoc: 'Drag and drop images or videos here after the gallery has been saved. This first pass is UI scaffolding only.'
  }
}

module.exports = {
  fields,
  labelResolver: item => item.title || item.slug || 'Untitled Gallery',
  adminConfig: {
    defaultColumns: 'title, slug, isActive, sortOrder'
  }
}
