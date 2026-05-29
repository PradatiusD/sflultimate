import { list } from '@keystone-6/core'
import { allowAll } from '@keystone-6/core/access'
import { checkbox, file, float, integer, relationship, select, text, timestamp } from '@keystone-6/core/fields'

export default list({
  access: allowAll,
  fields: {
    createdAt: timestamp({ defaultValue: { kind: 'now' }, validation: { isRequired: true } }),
    updatedAt: timestamp({ db: { updatedAt: true }, validation: { isRequired: true } }),
    name: text({ validation: { isRequired: true } }),
    firstName: text({ validation: { isRequired: true } }),
    lastName: text({ validation: { isRequired: true } }),
    gender: select({
      type: 'string',
      options: ['Male', 'Female', 'Other'].map(value => ({ label: value, value })),
      validation: { isRequired: true },
    }),
    age: integer({ validation: { isRequired: true } }),
    email: text({ validation: { isRequired: true } }),
    shirtSize: select({
      type: 'string',
      options: ['NA', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'].map(value => ({ label: value, value })),
    }),
    skillLevel: select({
      type: 'integer',
      options: [1, 2, 3, 4, 5, 6, 7, 8, 9].map(value => ({ label: value.toString(), value })),
    }),
    athleticismLevel: select({
      type: 'integer',
      options: [1, 2, 3, 4, 5].map(value => ({ label: value.toString(), value })),
    }),
    experienceLevel: select({
      type: 'integer',
      options: [1, 2, 3, 4, 5].map(value => ({ label: value.toString(), value })),
    }),
    throwsLevel: select({
      type: 'integer',
      options: [1, 2, 3, 4, 5].map(value => ({ label: value.toString(), value })),
    }),
    participation: select({
      type: 'integer',
      options: [30, 50, 80].map(value => ({ label: value.toString(), value })),
    }),
    registrationLevel: select({
      type: 'string',
      options: ['Student', 'Adult'].map(value => ({ label: value, value })),
      validation: { isRequired: true },
    }),
    leagues: relationship({ ref: 'League', many: true }),
    partnerName: text(),
    wouldCaptain: checkbox(),
    comments: text({ ui: { displayMode: 'textarea' } }),
    usauNumber: text(),
    phoneNumber: text(),
    wouldSponsor: checkbox(),
    willAttendFinals: checkbox(),
    donationAmount: float(),
    preferredPositions: text(),
    compedRegistration: checkbox(),
    profileImage: file({ storage: 'local_files' }),
  },
  ui: {
    labelField: 'name',
    listView: {
      initialColumns: ['firstName', 'lastName', 'email', 'gender', 'leagues'],
    },
  },
})
