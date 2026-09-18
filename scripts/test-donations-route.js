const assert = require('assert').strict
const { test, before, after, beforeEach } = require('node:test')
const { randomUUID } = require('crypto')
const { createRequire } = require('module')
const { Keystone } = require('@keystonejs/keystone')
const { MongooseAdapter } = require('@keystonejs/adapter-mongoose')
const client = require('../app/next/lib/server-graphql-client')

// External services are replaced at the module boundary, not through production factories.
const calls = { sales: [], emails: [], mutations: [] }
let paymentResult
let captchaResult
let emailFailure
let failMutation
let handler
let keystone
let model
const originalMutate = client.mutate
const origin = 'http://localhost:3100'
const payment = {
  generateGatewayClientToken: async () => 'sandbox-client-token',
  validateRecaptchaToken: async () => captchaResult,
  createSale: async options => {
    calls.sales.push(options)
    assert.equal(await model.countDocuments({ status: 'pending' }), 1)
    if (paymentResult instanceof Error) throw paymentResult
    return paymentResult
  }
}
const mailer = {
  createTransport: () => ({
    sendMail: async mail => {
      calls.emails.push(mail)
      assert.equal(await model.countDocuments({ status: 'submitted' }), 1)
      if (emailFailure) throw new Error('SMTP unavailable')
      return { accepted: [mail.to] }
    }
  })
}

function payload (overrides = {}) {
  return {
    amount: '25.00',
    from: 'Alex & Sam',
    email: 'donor@example.test',
    message: 'Thanks!\nSee you on the field.',
    requestId: randomUUID(),
    paymentMethodNonce: 'test-nonce',
    recaptchaToken: 'test-captcha',
    ...overrides
  }
}

async function request (body, options = {}) {
  const req = {
    method: 'POST',
    ip: '127.0.0.1',
    body,
    headers: { origin, 'content-type': 'application/json' },
    ...options
  }
  const res = {
    headers: {},
    setHeader (key, value) { this.headers[key] = value },
    status (code) { this.code = code; return this },
    json (body) { this.body = body; return this }
  }
  await handler(req, res)
  return res
}

before(async () => {
  process.env.DONATION_SITE_ORIGIN = origin
  process.env.RECAPTCHA_V2_SITE_SECRET = 'test-secret'
  process.env.SMTP_USER = 'test-user'
  process.env.SMTP_PASSWORD = 'test-password'
  const replacements = {
    '../app/next/lib/payment-utils': payment,
    nodemailer: mailer
  }
  for (const [name, exports] of Object.entries(replacements)) {
    const filename = require.resolve(name)
    require.cache[filename] = { id: filename, filename, loaded: true, exports }
  }
  keystone = new Keystone({
    name: 'donation-route-test',
    cookieSecret: 'test-only',
    adapter: new MongooseAdapter({ mongoUri: 'mongodb://127.0.0.1:27017/donation_route_test' })
  })
  keystone.createList('Donation', require('../app/lists/Donation'))
  keystone.createApolloServer({ schemaName: 'public', dev: true })
  await keystone.connect()
  global.sflKeystone = keystone
  model = keystone.lists.Donation.adapter.model
  client.mutate = async options => {
    calls.mutations.push(options)
    if (failMutation && failMutation(options)) throw new Error('Database unavailable')
    return originalMutate(options)
  }
  const filename = require.resolve('../app/next/pages/api/donate')
  const { code } = require('@babel/core').transformFileSync(filename, {
    babelrc: false, configFile: false, plugins: ['@babel/plugin-transform-modules-commonjs']
  })
  const loaded = { exports: {} }
  require('vm').runInThisContext('(function(require,module,exports){' + code + '\n})')(createRequire(filename), loaded, loaded.exports)
  handler = loaded.exports.default
})

after(async () => {
  client.mutate = originalMutate
  delete global.sflKeystone
  if (keystone) {
    await keystone.lists.Donation.adapter.model.db.dropDatabase()
    await keystone.disconnect()
  }
})

beforeEach(async () => {
  await model.deleteMany({})
  await model.db.collection('donation_rate_limits').deleteMany({})
  calls.sales.length = 0
  calls.emails.length = 0
  calls.mutations.length = 0
  captchaResult = { success: true, hostname: 'localhost' }
  paymentResult = { success: true, transaction: { id: 'sandbox-transaction', status: 'submitted_for_settlement' } }
  emailFailure = false
  failMutation = null
})

test('uses normal Keystone mutations to persist and confirm a donation', async () => {
  const body = payload()
  const result = await request(body)
  assert.equal(result.code, 200)
  assert.equal(result.body.status, 'submitted')
  assert.equal(result.body.amount, 2500)
  assert.equal(result.body.emailStatus, 'sent')
  assert.ok(calls.mutations.some(call => call.variables.data && call.variables.data.requestId === body.requestId), 'Creation must use the existing server GraphQL client')
  assert.equal(calls.sales.length, 1)
  assert.equal(calls.sales[0].amount, '25.00')
  assert.equal(Object.hasOwn(calls.sales[0], 'merchantAccountId'), false, 'Use the existing default merchant account')
  const saved = await model.findOne({ requestId: body.requestId }).lean()
  assert.equal(saved.from, body.from)
  assert.equal(saved.message, body.message)
  const stored = await client.query({
    query: '{ allDonations { createdAt confirmationEmailSentAt } }'
  })
  assert.ok(Number.isFinite(new Date(stored.data.allDonations[0].createdAt).getTime()))
  assert.ok(Number.isFinite(new Date(stored.data.allDonations[0].confirmationEmailSentAt).getTime()))
  assert.equal(saved.transactionId, 'sandbox-transaction')
  assert.equal(calls.sales[0].orderId, String(saved._id))
  assert.equal(saved.paymentMethodNonce, undefined)
  assert.equal(calls.emails.length, 1)
  assert.ok(calls.emails[0].text.includes('Alex & Sam'))
  assert.ok(calls.emails[0].html.includes('Alex &amp; Sam'))
})

test('Donation uses ordinary fields without email-resend locks', () => {
  const { fields } = require('../app/lists/Donation')
  for (const name of ['createdAt', 'message', 'from', 'amount', 'email', 'requestId']) {
    assert.ok(fields[name])
  }
  for (const name of ['emailSending', 'emailClaimToken', 'emailClaimExpiresAt']) {
    assert.equal(fields[name], undefined)
  }
})

test('enforces the exact cap and rejects malformed amounts before calling Braintree', async () => {
  const result = await request(payload({ amount: '250.00' }))
  assert.equal(result.code, 200)
  assert.equal(result.body.amount, 25000)
  assert.equal(calls.sales[0].amount, '250.00')
  for (const amount of ['250.01', '999', '4.99', '-5', '5.001', '5e1', 25]) {
    assert.equal((await request(payload({ amount }))).code, 400)
  }
  assert.equal(calls.sales.length, 1)
  assert.equal(await model.countDocuments({}), 1)
})

test('concurrent copies of one request create one record, charge once, and email once', async () => {
  const body = payload()
  const results = await Promise.all(Array.from({ length: 5 }, () => request(body)))
  assert.ok(results.some(result => result.code === 200))
  assert.ok(results.every(result => ['submitted', 'pending'].includes(result.body.status)), JSON.stringify(results.map(result => result.body)))
  assert.equal(calls.sales.length, 1)
  assert.equal(calls.emails.length, 1)
  assert.equal(await model.countDocuments({}), 1)
  captchaResult = { success: false }
  assert.equal((await request(body)).code, 200)
  assert.equal((await request({ ...body, amount: '30' })).code, 409)
  assert.equal(calls.sales.length, 1)
})

test('declines do not send email and replaying the same request never charges again', async () => {
  const body = payload()
  paymentResult = { success: false }
  assert.equal((await request(body)).body.status, 'failed')
  assert.equal((await request(body)).body.status, 'failed')
  assert.equal(calls.sales.length, 1)
  assert.equal(calls.emails.length, 0)
})

test('unknown payment outcomes stay blocked and preserve the reconciliation reference', async () => {
  const body = payload()
  paymentResult = new Error('Network timeout')
  const result = await request(body)
  assert.equal(result.code, 503)
  assert.equal(result.body.status, 'needsReview')
  assert.ok(result.body.reference)
  await request(body)
  assert.equal(calls.sales.length, 1)
  assert.equal(calls.emails.length, 0)
})

test('database failure before creation never charges', async () => {
  failMutation = options => Boolean(options.variables.data.requestId)
  assert.equal((await request(payload())).code, 503)
  assert.equal(calls.sales.length, 0)
})

test('database failure after payment never emails or permits another charge', async () => {
  failMutation = options => !options.variables.data.requestId
  const body = payload()
  assert.equal((await request(body)).body.status, 'needsReview')
  const replay = await request(body)
  assert.equal(replay.body.status, 'pending')
  assert.equal(calls.sales.length, 1)
  assert.equal(calls.emails.length, 0)
})

test('SMTP failure preserves successful donation and duplicate request does not resend', async () => {
  emailFailure = true
  const body = payload()
  const result = await request(body)
  assert.equal(result.code, 200)
  assert.equal(result.body.status, 'submitted')
  assert.equal(result.body.emailStatus, 'failed')
  assert.equal((await request(body)).body.emailStatus, 'failed')
  assert.equal(calls.sales.length, 1)
  assert.equal(calls.emails.length, 1)
})

test('failure to save email status does not turn a successful donation into a payment error', async () => {
  failMutation = options => !options.variables.data.requestId && Boolean(options.variables.data.confirmationEmailStatus)
  const result = await request(payload())
  assert.equal(result.code, 200)
  assert.equal(result.body.status, 'submitted')
  assert.equal(result.body.emailStatus, 'pending')
  assert.equal(calls.sales.length, 1)
})

test('rejects wrong origins, failed CAPTCHA, wrong hostname and oversized messages', async () => {
  assert.equal((await request(payload(), { headers: { origin: 'https://attacker.test' } })).code, 403)
  for (const result of [{ success: false }, { success: true, hostname: 'attacker.test' }]) {
    captchaResult = result
    assert.equal((await request(payload())).code, 400)
  }
  captchaResult = { success: true, hostname: 'localhost' }
  assert.equal((await request(payload({ message: 'x'.repeat(1001) }))).code, 400)
  assert.equal(calls.sales.length, 0)
})

test('list denies anonymous reads and writes but permits authenticated admin reads', async () => {
  await request(payload())
  for (const environment of ['development', 'production']) {
    process.env.NODE_ENV = environment
    const result = await keystone.executeGraphQL({
      query: '{ allDonations { id email createdAt } }',
      context: keystone.createContext({ authentication: {} })
    })
    assert.ok(result.errors.length)
  }
  const result = await keystone.executeGraphQL({
    query: '{ allDonations { id email createdAt } }',
    context: keystone.createContext({ authentication: { listKey: 'User', item: { id: 'admin' } } })
  })
  assert.equal(result.data.allDonations.length, 1)
  assert.ok(result.data.allDonations[0].createdAt)
  const denied = await keystone.executeGraphQL({
    query: 'mutation { createDonation(data: {amount: 1, email: "attacker@example.test", requestId: "fake"}) { id } }',
    context: keystone.createContext({ authentication: {} })
  })
  assert.ok(denied.errors.length)
})

test('method checks, client-token response and shared rate limits work at the route boundary', async () => {
  assert.equal((await request(null, { method: 'DELETE' })).code, 405)
  const token = await request(null, { method: 'GET' })
  assert.equal(token.body.clientToken, 'sandbox-client-token')
  assert.equal(token.headers['Cache-Control'], 'no-store')
  const results = await Promise.all(Array.from({ length: 12 }, () => request({})))
  assert.equal(results.filter(result => result.code === 400).length, 10)
  assert.equal(results.filter(result => result.code === 429).length, 2)
  assert.equal(calls.sales.length, 0)
})
