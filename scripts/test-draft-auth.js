const assert = require('assert')
const {
  hashPassword,
  verifyPassword
} = require('../app/next/lib/draft-auth')

async function run () {
  const password = 'layout-pull-42'
  const stored = await hashPassword(password)
  assert.ok(stored.salt)
  assert.ok(stored.hash)
  assert.strictEqual(await verifyPassword(password, stored), true)
  assert.strictEqual(await verifyPassword('wrong-password', stored), false)

  const second = await hashPassword(password)
  assert.notStrictEqual(stored.salt, second.salt)
  assert.notStrictEqual(stored.hash, second.hash)

  await assert.rejects(() => hashPassword('short'), /at least 8/)

  console.log('draft-auth: all assertions passed')
}

run().catch(error => {
  console.error(error)
  process.exitCode = 1
})
