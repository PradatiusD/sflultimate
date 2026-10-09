const assert = require('assert')
const http = require('http')
const express = require('express')
const configureExpress = require('../app/configure-express')

async function main () {
  const app = express()
  configureExpress(app)
  let handled = 0
  app.use((req, res) => {
    handled++
    res.sendStatus(200)
  })
  const server = app.listen(0, '127.0.0.1')
  await new Promise(resolve => server.once('listening', resolve))

  async function check (forwardedFor, expected, method = 'GET') {
    const before = handled
    const headers = forwardedFor ? { 'X-Forwarded-For': forwardedFor } : {}
    const status = await new Promise((resolve, reject) => {
      const req = http.request({
        hostname: '127.0.0.1',
        port: server.address().port,
        path: '/api/register',
        method,
        headers
      }, res => {
        res.resume()
        res.on('end', () => resolve(res.statusCode))
      })
      req.on('error', reject)
      req.end()
    })
    assert.strictEqual(status, expected, String(forwardedFor))
    assert.strictEqual(handled - before, expected === 403 ? 0 : 1)
  }

  try {
    for (let last = 96; last <= 103; last++) {
      await check(`18.97.9.${last}`, 403)
    }
    await check('18.97.9.95', 200)
    await check('18.97.9.104', 200)
    await check('203.0.113.1, 18.97.9.96', 403)
    await check('18.97.9.96, 203.0.113.1', 200)
    await check('::ffff:18.97.9.100', 403)
    await check('2001:db8::1', 200)
    await check(undefined, 200)
    await check('18.97.9.96', 403, 'POST')
    await check('203.0.113.1', 200, 'POST')
    console.log('IP block HTTP tests passed')
  } finally {
    await new Promise(resolve => server.close(resolve))
  }
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
