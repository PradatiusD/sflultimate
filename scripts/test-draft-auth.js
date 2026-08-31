const assert = require('assert')
const {
  hashPassword,
  verifyPassword,
  createCaptainToken,
  verifyCaptainToken,
  getCaptainTokenFromCookie,
  buildCaptainCookie,
  clearCaptainCookie
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

  const secret = 'test-secret-that-is-long-enough'
  const token = createCaptainToken({ draftSessionId: 'draft-1', teamId: 'team-2' }, secret, 1000, 3600)
  assert.deepStrictEqual(verifyCaptainToken(token, secret, 1200), {
    draftSessionId: 'draft-1',
    teamId: 'team-2',
    expiresAt: 4600
  })
  assert.strictEqual(verifyCaptainToken(token + 'tampered', secret, 1200), null)
  assert.strictEqual(verifyCaptainToken(token, secret, 4601), null)
  assert.strictEqual(verifyCaptainToken(token, 'different-secret', 1200), null)

  const cookie = buildCaptainCookie(token, {
    path: '/leagues/summer/draftboard',
    secure: true,
    maxAge: 3600
  })
  assert.match(cookie, /^sfl_draft_captain=/)
  assert.match(cookie, /HttpOnly/)
  assert.match(cookie, /SameSite=Lax/)
  assert.match(cookie, /Secure/)
  assert.match(cookie, /Path=\/leagues\/summer\/draftboard/)
  assert.strictEqual(getCaptainTokenFromCookie(`other=1; ${cookie.split(';')[0]}`), token)

  const cleared = clearCaptainCookie('/leagues/summer/draftboard', true)
  assert.match(cleared, /Max-Age=0/)
  assert.match(cleared, /Secure/)

  console.log('draft-auth: all assertions passed')
}

run().catch(error => {
  console.error(error)
  process.exitCode = 1
})
