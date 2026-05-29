import { list } from '@keystone-6/core'
import { allowAll } from '@keystone-6/core/access'
import { file, select, text } from '@keystone-6/core/fields'

export default list({
  access: allowAll,
  fields: {
    name: text({ validation: { isRequired: true }, isIndexed: true }),
    color: text(),
    email: text(),
    captainNames: text({ validation: { isRequired: true }, isIndexed: true }),
    locationName: text({ validation: { isRequired: true }, isIndexed: true }),
    competitionName: select({
      type: 'string',
      options: ['Pro', 'Club', 'Recreation'].map(value => ({ label: value, value })),
      validation: { isRequired: true },
    }),
    image: file({ storage: 'local_files' }),
  },
  ui: {
    labelField: 'name',
    listView: {
      initialColumns: ['name', 'captainNames', 'locationName', 'competitionName', 'image'],
    },
  },
})
