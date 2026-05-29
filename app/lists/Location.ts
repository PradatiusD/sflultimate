import { list } from '@keystone-6/core'
import { allowAll } from '@keystone-6/core/access'
import { float, integer, select, text } from '@keystone-6/core/fields'

export default list({
  access: allowAll,
  fields: {
    name: text({ validation: { isRequired: true }, isIndexed: true }),
    slug: text({ validation: { isRequired: true } }),
    mapsLocationUrl: text(),
    type: select({
      type: 'string',
      options: ['grass', 'turf', 'beach', 'indoor'].map(value => ({ label: value, value })),
      validation: { isRequired: true },
      label: 'Field Type',
    }),
    addressStreet: text({ validation: { isRequired: true }, label: 'Street Address' }),
    addressCity: text({ validation: { isRequired: true }, label: 'City' }),
    addressState: text({ validation: { isRequired: true }, label: 'State' }),
    addressZipCode: integer({ validation: { isRequired: true }, label: 'Zip Code' }),
    latitude: float({ label: 'Latitude' }),
    longitude: float({ label: 'Longitude' }),
  },
  ui: {
    labelField: 'name',
    listView: {
      initialColumns: ['name', 'type', 'addressCity', 'addressState'],
    },
  },
})
