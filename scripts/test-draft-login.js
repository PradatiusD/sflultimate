const assert = require('assert').strict
const http = require('http')
const { createRequire } = require('module')
const express = require('express')
const { SessionManager } = require('@keystonejs/session')
const store = require('../app/next/lib/draft-store')
const { hashPassword, verifyPassword } = require('../app/next/lib/draft-auth')
const { getViewerFromRequest, sendApiError } = require('../app/next/lib/draft-api')

function loadHandler (name) {
  const filename = require.resolve(`../app/next/pages/api/draft/${name}`)
  const { code } = require('@babel/core').transformFileSync(filename, {
    babelrc: false, configFile: false, plugins: ['@babel/plugin-transform-modules-commonjs']
  })
  const loaded = { exports: {} }
  require('vm').runInThisContext('(function(require,module,exports){' + code + '\n})')(createRequire(filename), loaded, loaded.exports)
  return loaded.exports.default
}

function request (port, path, body, cookie) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port,
      path,
      method: body ? 'POST' : 'GET',
      headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}) }
    }, res => {
      let text = ''
      res.on('data', chunk => { text += chunk })
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(text) }))
    })
    req.on('error', reject)
    req.end(body ? JSON.stringify(body) : undefined)
  })
}

async function run () {
  // Only persistence is stubbed: real route handlers, password hashing,
  // Keystone session middleware, cookies, and HTTP requests are exercised.
  const originalAuthenticate = store.authenticateCaptain
  const originalGetState = store.getDraftState
  const password = 'test-captain-password'
  const stored = await hashPassword(password)
  const identity = { draftSessionId: 'test-draft', teamId: 'test-team' }
  store.authenticateCaptain = async (league, team, supplied) => {
    if (league !== 'test-league' || team !== 'test-team' || !await verifyPassword(supplied, stored)) {
      throw new store.DraftError('Team or password is incorrect', 401, 'LOGIN_FAILED')
    }
    return identity
  }
  store.getDraftState = async (league, viewer) => ({ viewer, league: { slug: league } })
  const app = express()
  const sessions = new SessionManager({ cookieSecret: 'test-only-session-secret', cookie: { secure: false, httpOnly: true } })
  app.use(sessions.getSessionMiddleware({ keystone: { lists: {} } }))
  app.use(express.json())
  app.post('/login', loadHandler('login'))
  app.post('/logout', loadHandler('logout'))
  app.get('/viewer', (req, res) => {
    try { res.json(getViewerFromRequest(req)) } catch (error) { sendApiError(res, error) }
  })
  const server = app.listen(0, '127.0.0.1')
  await new Promise(resolve => server.once('listening', resolve))
  const port = server.address().port
  try {
    assert.equal((await request(port, '/viewer')).status, 401)
    const invalid = await request(port, '/login', { league: 'test-league', team: 'test-team', password: 'incorrect' })
    assert.equal(invalid.status, 401)
    const login = await request(port, '/login', { league: 'test-league', team: 'test-team', password })
    assert.equal(login.status, 200)
    assert.equal(login.body.state.viewer.role, 'captain')
    const setCookie = login.headers['set-cookie'][0]
    assert.match(setCookie, /^keystone\.sid=/)
    assert.match(setCookie, /HttpOnly/)
    assert.match(setCookie, /SameSite=Lax/)
    const cookie = setCookie.split(';')[0]
    assert.deepEqual((await request(port, '/viewer', null, cookie)).body, { role: 'captain', ...identity })
    assert.equal((await request(port, '/logout', { league: 'test-league' }, cookie)).status, 200)
    assert.equal((await request(port, '/viewer', null, cookie)).status, 401)
    console.log('draft-login: real HTTP login, session reuse, invalid password, and logout passed (fixture persistence)')
  } finally {
    await new Promise(resolve => server.close(resolve))
    store.authenticateCaptain = originalAuthenticate
    store.getDraftState = originalGetState
  }
}

run().catch(error => {
  console.error(error)
  process.exitCode = 1
})
