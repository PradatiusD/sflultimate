import { list } from '@keystone-6/core'
import { allowAll } from '@keystone-6/core/access'
import { checkbox, file, integer, relationship, select, text } from '@keystone-6/core/fields'

export default list({
  access: allowAll,
  fields: {
    title: text(),
    gallery: relationship({ ref: 'Gallery.assets' }),
    file: file({ storage: 'local_files' }),
    assetType: select({
      type: 'string',
      options: [
        { label: 'Image', value: 'image' },
        { label: 'Video', value: 'video' }
      ]
    }),
    caption: text(),
    altText: text(),
    credit: text(),
    sortOrder: integer(),
    isActive: checkbox()
  },
  ui: {
    labelField: 'title',
    listView: {
      initialColumns: ['title', 'gallery', 'assetType', 'sortOrder', 'isActive']
    }
  }
})
