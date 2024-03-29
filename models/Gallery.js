const keystone = require('keystone')

/**
 * Gallery Model
 * =============
 */

const Gallery = new keystone.List('Gallery', {
  autokey: { from: 'name', path: 'key', unique: true }
})

Gallery.add({
  name: { type: String, required: true },
  publishedDate: { type: Date, default: Date.now }
  // heroImage: { type: Types.CloudinaryImage },
  // images: { type: Types.CloudinaryImages }
})

Gallery.register()
