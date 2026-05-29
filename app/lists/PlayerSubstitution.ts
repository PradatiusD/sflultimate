import { list } from '@keystone-6/core'
import { allowAll } from '@keystone-6/core/access'
import { relationship, select, text, timestamp } from '@keystone-6/core/fields'

export default list({
  access: allowAll,
  fields: {
    createdAt: timestamp({ defaultValue: { kind: 'now' }, validation: { isRequired: true } }),
    updatedAt: timestamp({ db: { updatedAt: true }, validation: { isRequired: true } }),
    firstName: text({ validation: { isRequired: true } }),
    lastName: text({ validation: { isRequired: true } }),
    name: text({ validation: { isRequired: true } }),
    gender: select({
      type: 'string',
      options: ['Male', 'Female', 'Other'].map(value => ({ label: value, value })),
      validation: { isRequired: true },
    }),
    email: text({ validation: { isRequired: true } }),
    league: relationship({ ref: 'League' }),
    team: relationship({ ref: 'Team' }),
    comments: text({ ui: { displayMode: 'textarea' } }),
    phoneNumber: text(),
  },
  ui: {
    labelField: 'name',
    listView: {
      initialColumns: ['name', 'email', 'gender', 'league', 'team'],
    },
  },
})
