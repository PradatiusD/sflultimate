import { list } from '@keystone-6/core'
import { allowAll } from '@keystone-6/core/access'
import { checkbox, file, integer, relationship, text } from '@keystone-6/core/fields'

export default list({
  access: allowAll,
  fields: {
    title: text({ isIndexed: true }),
    slug: text({ isIndexed: true }),
    summary: text({ ui: { displayMode: 'textarea' } }),
    description: text({ ui: { displayMode: 'textarea' } }),
    coverImage: file({ storage: 'local_files' }),
    eventDateLabel: text(),
    sortOrder: integer(),
    isActive: checkbox(),
    assets: relationship({ ref: 'GalleryAsset.gallery', many: true })
  },
  ui: {
    labelField: 'title',
    listView: {
      initialColumns: ['title', 'slug', 'isActive', 'sortOrder']
    }
  }
})
