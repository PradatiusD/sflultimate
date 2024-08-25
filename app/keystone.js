const { Keystone } = require('@keystonejs/keystone')
const { MongooseAdapter: Adapter } = require('@keystonejs/adapter-mongoose')
const adapterConfig = { mongoUri: 'mongodb://localhost/sflultimateV5' }
const keystone = new Keystone({
  adapter: new Adapter(adapterConfig),
  cookieSecret: '54243865006a8e5622eb51e8d73f6416b4177383559f1870f26fbfc8463e264a'
})

module.exports = keystone
