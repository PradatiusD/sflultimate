import { list } from '@keystone-6/core'
import { allowAll } from '@keystone-6/core/access'
import { checkbox, file, integer, text } from '@keystone-6/core/fields'

export default list({
  access: allowAll,
  fields: {
    firstName: text({ validation: { isRequired: true } }),
    lastName: text({ validation: { isRequired: true } }),
    order: integer({ validation: { isRequired: true } }),
    active: checkbox(),
    description: text({ validation: { isRequired: true } }),
    image: file({ storage: 'local_files' }),
  },
  ui: {
    listView: {
      initialColumns: ['firstName', 'lastName', 'order', 'active', 'image'],
    },
  },
})
