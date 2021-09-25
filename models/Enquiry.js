const keystone = require('keystone')
const Types = keystone.Field.Types

/**
 * Enquiry Model
 * =============
 */
const Enquiry = new keystone.List('Enquiry', {
  nocreate: true,
  noedit: true
})

Enquiry.add({
  name: { type: Types.Name, required: true },
  email: { type: Types.Email, required: true },
  phone: { type: String },
  enquiryType: {
    type: Types.Select,
    options: [
      { value: 'message', label: 'Just leaving a message' },
      { value: 'question', label: 'I\'ve got a question' },
      { value: 'other', label: 'Something else...' }
    ]
  },
  message: { type: Types.Markdown, required: true },
  createdAt: { type: Date, default: Date.now }
})

Enquiry.schema.pre('save', function (next) {
  this.wasNew = this.isNew
  next()
})

Enquiry.schema.post('save', function () {
  if (this.wasNew) {
    this.sendNotificationEmail()
  }
})

Enquiry.schema.methods.sendNotificationEmail = function (callback) {
  if (typeof callback !== 'function') {
    callback = function () {}
  }

  const enquiry = this

  keystone.list('Player').model.find().where('isAdmin', true).exec(function (err, admins) {
    if (err) return callback(err)

    new keystone.Email('enquiry-notification').send({
      to: admins,
      from: {
        name: 'SFLUltimate',
        email: 'contact@sflultimate.com'
      },
      subject: 'New Enquiry for SFLUltimate',
      enquiry: enquiry
    }, callback)
  })
}

Enquiry.defaultSort = '-createdAt'
Enquiry.defaultColumns = 'name, email, enquiryType, createdAt'
Enquiry.register()
