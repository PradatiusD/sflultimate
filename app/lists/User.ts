import { list } from '@keystone-6/core'
import { allowAll } from '@keystone-6/core/access'
import { password, text } from '@keystone-6/core/fields'

export default list({
  access: allowAll,
  fields: {
    firstName: text({ validation: { isRequired: true } }),
    lastName: text({ validation: { isRequired: true } }),
    email: text({ validation: { isRequired: true }, isIndexed: 'unique' }),
    password: password({ validation: { isRequired: true } }),
  },
  ui: {
    listView: {
      initialColumns: ['firstName', 'lastName', 'email'],
    },
  },
})
