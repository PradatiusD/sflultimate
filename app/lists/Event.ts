import { list } from '@keystone-6/core'
import { allowAll } from '@keystone-6/core/access'
import { file, text, timestamp } from '@keystone-6/core/fields'

export default list({
  access: allowAll,
  fields: {
    name: text({ validation: { isRequired: true } }),
    slug: text(),
    category: text(),
    startTime: timestamp({ validation: { isRequired: true } }),
    endTime: timestamp({ validation: { isRequired: true } }),
    location: text({ validation: { isRequired: true } }),
    summary: text({ ui: { displayMode: 'textarea' } }),
    description: text({
      validation: { isRequired: true },
      ui: { displayMode: 'textarea' },
    }),
    image: file({ storage: 'local_files' }),
    moreInformationUrl: text(),
  },
  ui: {
    labelField: 'name',
    listView: {
      initialColumns: ['name', 'startTime', 'endTime', 'location', 'image'],
    },
  },
})
