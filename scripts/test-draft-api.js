const assert = require('assert')
const {
  requireMethod,
  getLeagueSlug,
  getViewerFromRequest
} = require('../app/next/lib/draft-api')

assert.doesNotThrow(() => requireMethod({ method: 'GET' }, 'GET'))
assert.throws(() => requireMethod({ method: 'POST' }, 'GET'), error => error.statusCode === 405)
assert.strictEqual(getLeagueSlug({ query: { league: 'summer-2026' }, body: {} }), 'summer-2026')
assert.strictEqual(getLeagueSlug({ query: {}, body: { league: 'fall-2026' } }), 'fall-2026')
assert.throws(() => getLeagueSlug({ query: {}, body: {} }), /league/i)

const captain = { draftSessionId: 'draft-1', teamId: 'team-1', expiresAt: Date.now() + 60000 }
assert.deepStrictEqual(getViewerFromRequest({ headers: {}, session: { draftCaptain: captain } }), {
  role: 'captain', draftSessionId: 'draft-1', teamId: 'team-1'
})
assert.throws(() => getViewerFromRequest({ headers: {}, session: {} }), error => error.statusCode === 401)
assert.throws(() => getViewerFromRequest({ headers: {}, session: { draftCaptain: { ...captain, expiresAt: 0 } } }), error => error.statusCode === 401)
assert.deepStrictEqual(getViewerFromRequest({ user: { id: 'admin' }, headers: {}, session: {} }), { role: 'admin' })
assert.deepStrictEqual(getViewerFromRequest({ user: { id: 'admin' }, headers: {}, session: { draftCaptain: captain } }, { captainOnly: true }), {
  role: 'captain', draftSessionId: 'draft-1', teamId: 'team-1'
})

console.log('draft-api: all assertions passed')
