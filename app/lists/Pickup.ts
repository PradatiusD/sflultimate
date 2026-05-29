import { list } from '@keystone-6/core'
import { allowAll } from '@keystone-6/core/access'
import { checkbox, integer, relationship, text, timestamp } from '@keystone-6/core/fields'

export default list({
  access: allowAll,
  fields: {
    title: text({ validation: { isRequired: true }, isIndexed: true, label: 'Pickup Name' }),
    isActive: checkbox({ defaultValue: false }),
    order: integer({ validation: { isRequired: true } }),
    day: text({ validation: { isRequired: true }, label: 'Day(s) Played' }),
    time: text({ validation: { isRequired: true }, label: 'Start Time' }),
    contactName: text(),
    contactEmail: text(),
    contactPhone: text(),
    contactUrl: text({ label: 'Contact URL' }),
    contactWhatsapp: text({ label: 'WhatsApp Group URL' }),
    description: text({ validation: { isRequired: true }, ui: { displayMode: 'textarea' } }),
    updatedAt: timestamp({ db: { updatedAt: true } }),
    slug: text({ validation: { isRequired: true } }),
    location: relationship({ ref: 'Location' }),
  },
  ui: {
    labelField: 'title',
    listView: {
      initialColumns: ['isActive', 'order', 'title', 'location', 'day', 'time'],
    },
  },
})
