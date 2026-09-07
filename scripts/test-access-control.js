const assert = require('assert')

function loadAccess (nodeEnv) {
  process.env.NODE_ENV = nodeEnv
  const accessPath = require.resolve('../app/access')
  delete require.cache[accessPath]
  return require(accessPath)
}

const development = loadAccess('development')
assert.deepStrictEqual(development.defaultAccess, {
  list: true,
  field: true,
  custom: true
})

const production = loadAccess('production')
assert.strictEqual(production.defaultAccess.list({ authentication: {} }), false)
assert.strictEqual(production.defaultAccess.field({ authentication: {} }), false)
assert.strictEqual(production.defaultAccess.custom({ authentication: {} }), false)
assert.strictEqual(production.defaultAccess.list({ authentication: { item: { id: 'admin' } } }), true)

const userList = require('../app/lists/User')
assert.strictEqual(userList.access.auth, true)

console.log('Access control tests passed')
