const { Keystone } = require('@keystonejs/keystone')
const { MongooseAdapter: Adapter } = require('@keystonejs/adapter-mongoose')
const adapterConfig = { mongoUri: 'mongodb://localhost/sflultimateV5' }
const keystone = new Keystone({
  adapter: new Adapter(adapterConfig)
})

module.exports = keystone
