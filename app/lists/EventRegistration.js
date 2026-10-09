const { Text, Integer, DateTime, Select, Relationship } = require('@keystonejs/fields')

const admin = ({ authentication }) => Boolean(authentication && authentication.item && authentication.listKey === 'User')
const deny = () => false

module.exports = {
  access: { read: admin, create: deny, update: deny, delete: deny },
  fields: {
    createdAt: { type: DateTime, defaultValue: () => new Date().toISOString(), isRequired: true },
    name: { type: Text, isRequired: true },
    email: { type: Text, isRequired: true },
    comments: { type: Text, isMultiline: true },
    amountPaid: { type: Integer, label: 'Amount paid (USD)', isRequired: true },
    event: { type: Relationship, ref: 'Event', many: false, isRequired: true },
    status: { type: Select, options: 'pending, submitted, failed, needsReview', defaultValue: 'pending', isRequired: true },
    transactionId: { type: Text },
    requestId: { type: Text, isUnique: true, isRequired: true },
    confirmationEmailStatus: { type: Select, options: 'pending, sent, failed', defaultValue: 'pending' },
    confirmationEmailSentAt: { type: DateTime }
  },
  labelResolver: item => item.name || `Event registration ${item.id}`,
  adminConfig: { defaultColumns: 'createdAt, name, email, amountPaid, event, status, confirmationEmailStatus' }
}
