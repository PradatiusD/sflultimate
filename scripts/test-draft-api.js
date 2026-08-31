const assert = require('assert')
const {
  requireMethod,
  getLeagueSlug,
  getCaptainCookiePath
} = require('../app/next/lib/draft-api')

assert.doesNotThrow(() => requireMethod({ method: 'GET' }, 'GET'))
assert.throws(() => requireMethod({ method: 'POST' }, 'GET'), error => error.statusCode === 405)
assert.strictEqual(getLeagueSlug({ query: { league: 'summer-2026' }, body: {} }), 'summer-2026')
assert.strictEqual(getLeagueSlug({ query: {}, body: { league: 'fall-2026' } }), 'fall-2026')
assert.throws(() => getLeagueSlug({ query: {}, body: {} }), /league/i)
assert.strictEqual(getCaptainCookiePath('summer-2026'), '/')
assert.throws(() => getCaptainCookiePath('../admin'), /slug/i)

console.log('draft-api: all assertions passed')
