const keystone = require('keystone')

/**
 * Location Model
 * =============
 */

const Location = new keystone.List('Location')

Location.add({
  name: {
    type: String,
    initial: true,
    required: true,
    index: true
  }
})

Location.defaultColumns = 'name'
Location.register()
