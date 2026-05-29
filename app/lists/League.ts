import { list } from '@keystone-6/core'
import { allowAll } from '@keystone-6/core/access'
import { checkbox, file, integer, relationship, text, timestamp } from '@keystone-6/core/fields'

export default list({
  access: allowAll,
  fields: {
    name: text({ validation: { isRequired: true } }),
    title: text({ validation: { isRequired: true }, isIndexed: true }),
    slug: text({ validation: { isRequired: true }, isIndexed: true }),
    summary: text(),
    description: text({ ui: { displayMode: 'textarea' } }),
    isActive: checkbox({ defaultValue: false }),
    numberOfWeeksOfPlay: integer(),
    earlyRegistrationStart: timestamp(),
    earlyRegistrationEnd: timestamp(),
    registrationStart: timestamp(),
    registrationEnd: timestamp(),
    lateRegistrationStart: timestamp(),
    lateRegistrationEnd: timestamp(),
    pricingEarlyStudent: integer({ validation: { isRequired: true }, defaultValue: 30 }),
    pricingEarlyAdult: integer({ validation: { isRequired: true }, defaultValue: 55 }),
    pricingRegularStudent: integer({ validation: { isRequired: true }, defaultValue: 30 }),
    pricingRegularAdult: integer({ validation: { isRequired: true }, defaultValue: 55 }),
    pricingLateStudent: integer({ validation: { isRequired: true }, defaultValue: 55 }),
    pricingLateAdult: integer({ validation: { isRequired: true }, defaultValue: 55 }),
    finalsTournamentStartDate: timestamp(),
    finalsTournamentEndDate: timestamp(),
    finalsTournamentDescription: text({ ui: { displayMode: 'textarea' } }),
    finalsTournamentLocation: relationship({ ref: 'Location' }),
    jerseyDesign: file({ storage: 'local_files' }),
    registrationShareImage: file({ storage: 'local_files' }),
    requestAttendance: checkbox(),
    requestShirtSize: checkbox(),
    requestSponsorship: checkbox(),
    champion: relationship({ ref: 'Team' }),
  },
  ui: {
    labelField: 'title',
    listView: {
      initialColumns: ['title', 'isActive', 'registrationStart', 'registrationEnd', 'champion'],
    },
  },
})
