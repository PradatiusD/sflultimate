const { Text } = require('@keystonejs/fields')

module.exports = {
  type: Text.type,
  implementation: Text.implementation,
  views: {
    Controller: Text.views.Controller,
    Filter: Text.views.Filter,
    Field: require.resolve('./views/Field'),
    Cell: require.resolve('./views/Cell')
  },
  adapters: Text.adapters
}
