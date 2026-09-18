const { Text, Integer, DateTime, Select } = require('@keystonejs/fields')

// User is the application's administrator authentication list. Never open in development.
const admin = ({ authentication }) => Boolean(authentication && authentication.item && authentication.listKey === 'User')
const deny = () => false

module.exports = {
  access: { read: admin, create: deny, update: deny, delete: deny },
  fields: {
    createdAt: { type: DateTime, defaultValue: () => new Date().toISOString(), isRequired: true },
    from: { type: Text, defaultValue: 'Anonymous' },
    message: { type: Text, isMultiline: true },
    amount: { type: Integer, label: 'Amount (USD cents)', isRequired: true }, // Never floating-point dollars
    email: { type: Text, isRequired: true },
    status: { type: Select, options: 'pending, submitted, failed, needsReview', defaultValue: 'pending', isRequired: true },
    transactionId: { type: Text },
    requestId: { type: Text, isUnique: true, isRequired: true },
    confirmationEmailStatus: { type: Select, options: 'pending, sent, failed', defaultValue: 'pending' },
    confirmationEmailSentAt: { type: DateTime }
  },
  labelResolver: item => `Donation ${item.id}`,
  adminConfig: { defaultColumns: 'createdAt, from, amount, status, confirmationEmailStatus' }
}
