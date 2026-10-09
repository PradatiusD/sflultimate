const assert = require('assert')
const { startCaptainSession, endCaptainSession } = require('../app/next/lib/draft-auth')

async function run () {
  const identity = { draftSessionId: 'draft-1', teamId: 'team-1' }
  let regenerated = false
  let saved = false
  const req = {
    session: {
      keystoneListKey: 'User',
      keystoneItemId: 'admin-1',
      regenerate (callback) {
        regenerated = true
        req.session = { cookie: {}, save (done) { saved = true; done() } }
        callback()
      }
    }
  }
  await startCaptainSession(req, identity)
  assert.ok(regenerated, 'Login rotates the session ID')
  assert.ok(saved, 'Login persists the session before returning')
  assert.strictEqual(req.session.cookie.sameSite, 'lax')
  assert.strictEqual(req.session.cookie.httpOnly, true)
  assert.strictEqual(req.session.draftCaptain.teamId, identity.teamId)
  assert.ok(req.session.draftCaptain.expiresAt > Date.now())
  assert.strictEqual(req.session.keystoneListKey, 'User')
  assert.strictEqual(req.session.keystoneItemId, 'admin-1')
  await endCaptainSession(req)
  assert.strictEqual(req.session.draftCaptain, undefined)
  assert.strictEqual(req.session.keystoneItemId, 'admin-1', 'Captain logout does not sign out the commissioner')
  await assert.rejects(() => startCaptainSession({}, identity), /session/i)
  console.log('draft-session: all assertions passed')
}

run().catch(error => {
  console.error(error)
  process.exitCode = 1
})
