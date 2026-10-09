const { Keystone } = require('@keystonejs/keystone')
const { MongooseAdapter: Adapter } = require('@keystonejs/adapter-mongoose')
const { defaultAccess } = require('./access')
const adapterConfig = { mongoUri: process.env.MONGOLAB_URI.replace('/sflultimate', '/sflultimateV5') }
const keystone = new Keystone({
  adapter: new Adapter(adapterConfig),
  cookieSecret: '54243865006a8e5622eb51e8d73f6416b4177383559f1870f26fbfc8463e264a',
  defaultAccess
})

module.exports = keystone
