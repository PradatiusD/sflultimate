import { list } from '@keystone-6/core'
import { allowAll } from '@keystone-6/core/access'
import { file, text, timestamp } from '@keystone-6/core/fields'

export default list({
  access: allowAll,
  fields: {
    title: text({ validation: { isRequired: true } }),
    publishedDate: timestamp(),
    slug: text({ validation: { isRequired: true } }),
    summary: text({ ui: { displayMode: 'textarea' } }),
    body: text({ ui: { displayMode: 'textarea' } }),
    image: file({ storage: 'local_files' }),
  },
  ui: {
    labelField: 'title',
    listView: {
      initialColumns: ['title', 'publishedDate', 'slug', 'image'],
    },
  },
})
