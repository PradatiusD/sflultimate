const crypto = require('crypto')
const { promisify } = require('util')

const scrypt = promisify(crypto.scrypt)
const COOKIE_NAME = 'sfl_draft_captain'

function toBase64Url (value) {
  return Buffer.from(value)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

function fromBase64Url (value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padding = '='.repeat((4 - (normalized.length % 4)) % 4)
  return Buffer.from(normalized + padding, 'base64')
}

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

function sign (encodedPayload, secret) {
  return toBase64Url(crypto.createHmac('sha256', secret).update(encodedPayload).digest())
}

function createCaptainToken (identity, secret, nowSeconds = Math.floor(Date.now() / 1000), ttlSeconds = 60 * 60 * 12) {
  if (!secret) throw new Error('DRAFT_SESSION_SECRET is required')
  const payload = {
    draftSessionId: String(identity.draftSessionId),
    teamId: String(identity.teamId),
    expiresAt: nowSeconds + ttlSeconds
  }
  const encodedPayload = toBase64Url(JSON.stringify(payload))
  return `${encodedPayload}.${sign(encodedPayload, secret)}`
}

function verifyCaptainToken (token, secret, nowSeconds = Math.floor(Date.now() / 1000)) {
  if (!token || !secret || typeof token !== 'string') return null
  const parts = token.split('.')
  if (parts.length !== 2) return null

  const expectedSignature = Buffer.from(sign(parts[0], secret))
  const actualSignature = Buffer.from(parts[1])
  if (expectedSignature.length !== actualSignature.length || !crypto.timingSafeEqual(expectedSignature, actualSignature)) {
    return null
  }

  try {
    const payload = JSON.parse(fromBase64Url(parts[0]).toString('utf8'))
    if (!payload.draftSessionId || !payload.teamId || !Number.isFinite(payload.expiresAt) || payload.expiresAt < nowSeconds) {
      return null
    }
    return payload
  } catch (error) {
    return null
  }
}

function parseCookies (cookieHeader = '') {
  return cookieHeader.split(';').reduce((cookies, pair) => {
    const separator = pair.indexOf('=')
    if (separator === -1) return cookies
    const name = pair.slice(0, separator).trim()
    const value = pair.slice(separator + 1).trim()
    if (name) cookies[name] = decodeURIComponent(value)
    return cookies
  }, {})
}

function getCaptainTokenFromCookie (cookieHeader) {
  return parseCookies(cookieHeader)[COOKIE_NAME] || null
}

function buildCaptainCookie (token, options) {
  const parts = [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    `Path=${options.path}`,
    `Max-Age=${options.maxAge}`,
    'HttpOnly',
    'SameSite=Lax'
  ]
  if (options.secure) parts.push('Secure')
  return parts.join('; ')
}

function clearCaptainCookie (path, secure) {
  return buildCaptainCookie('', { path, secure, maxAge: 0 })
}

function getDraftSessionSecret () {
  if (!process.env.DRAFT_SESSION_SECRET) {
    throw new Error('DRAFT_SESSION_SECRET must be configured')
  }
  return process.env.DRAFT_SESSION_SECRET
}

module.exports = {
  COOKIE_NAME,
  hashPassword,
  verifyPassword,
  createCaptainToken,
  verifyCaptainToken,
  getCaptainTokenFromCookie,
  buildCaptainCookie,
  clearCaptainCookie,
  getDraftSessionSecret
}
