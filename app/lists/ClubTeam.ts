import { list } from '@keystone-6/core'
import { allowAll } from '@keystone-6/core/access'
import { checkbox, file, integer, select, text } from '@keystone-6/core/fields'

export default list({
  access: allowAll,
  fields: {
    name: text({ validation: { isRequired: true } }),
    category: select({
      type: 'string',
      options: ['Mixed', 'Open', 'Women', 'College - Women', 'College - Mixed', 'College - Open'].map(value => ({
        label: value,
        value,
      })),
    }),
    order: integer({ validation: { isRequired: true } }),
    active: checkbox(),
    description: text({ validation: { isRequired: true } }),
    image: file({ storage: 'local_files' }),
    instagramPageUrl: text(),
    facebookPageUrl: text(),
    websiteUrl: text(),
    twitterPageUrl: text(),
    interestFormPageUrl: text(),
  },
  ui: {
    labelField: 'name',
    listView: {
      initialColumns: ['name', 'category', 'order', 'active', 'image'],
    },
  },
})
