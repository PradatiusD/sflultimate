// custom-fields/CustomDateTime/index.js
const { DateTime } = require('@keystonejs/fields')

module.exports = {
  type: DateTime.type,
  implementation: DateTime.implementation,
  views: {
    Controller: DateTime.views.Controller,
    Filter: DateTime.views.Filter,
    Field: require.resolve('./views/Field'),
    Cell: require.resolve('./views/Cell')
  },
  adapters: DateTime.adapters
}
