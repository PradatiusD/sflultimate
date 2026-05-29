import { list } from '@keystone-6/core'
import { allowAll } from '@keystone-6/core/access'
import { checkbox, integer, relationship, text } from '@keystone-6/core/fields'

export default list({
  access: allowAll,
  fields: {
    title: text({ validation: { isRequired: true } }),
    order: integer({ validation: { isRequired: true } }),
    active: checkbox(),
    description: text({
      validation: { isRequired: true },
      ui: { displayMode: 'textarea' },
    }),
    commitment: text({ validation: { isRequired: true } }),
    assigned: relationship({ ref: 'BoardMember', many: true }),
  },
  ui: {
    labelField: 'title',
    listView: {
      initialColumns: ['title', 'order', 'active', 'commitment', 'assigned'],
    },
  },
})
