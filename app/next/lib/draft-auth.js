const crypto = require('crypto')
const { promisify } = require('util')

const scrypt = promisify(crypto.scrypt)

async function hashPassword (password) {
  if (typeof password !== 'string' || password.length < 8) {
    throw new Error('Captain password must be at least 8 characters')
  }
  const salt = crypto.randomBytes(16)
  const derived = await scrypt(password, salt, 64)
  return {
    salt: salt.toString('hex'),
    hash: derived.toString('hex')
  }
}

async function verifyPassword (password, stored) {
  if (!stored || !stored.salt || !stored.hash || typeof password !== 'string') {
    return false
  }
  try {
    const expected = Buffer.from(stored.hash, 'hex')
    const actual = await scrypt(password, Buffer.from(stored.salt, 'hex'), expected.length)
    return expected.length === actual.length && crypto.timingSafeEqual(expected, actual)
  } catch (error) {
    return false
  }
}

async function startCaptainSession (req, identity) {
  if (!req.session) throw new Error('Keystone session middleware is required')
  // Rotate the session ID without signing an existing commissioner out.
  const { keystoneListKey, keystoneItemId } = req.session
  await new Promise((resolve, reject) => req.session.regenerate(error => error ? reject(error) : resolve()))
  if (keystoneListKey && keystoneItemId) {
    req.session.keystoneListKey = keystoneListKey
    req.session.keystoneItemId = keystoneItemId
  }
  req.session.cookie.sameSite = 'lax'
  req.session.cookie.httpOnly = true
  req.session.draftCaptain = {
    draftSessionId: identity.draftSessionId,
    teamId: identity.teamId,
    expiresAt: Date.now() + 12 * 60 * 60 * 1000
  }
  await new Promise((resolve, reject) => req.session.save(error => error ? reject(error) : resolve()))
}

async function endCaptainSession (req) {
  if (!req.session) return
  delete req.session.draftCaptain
  await new Promise((resolve, reject) => req.session.save(error => error ? reject(error) : resolve()))
}

module.exports = {
  hashPassword,
  verifyPassword,
  startCaptainSession,
  endCaptainSession
}
