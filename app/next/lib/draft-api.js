const { DraftError } = require('./draft-store')

function requireMethod (req, allowedMethods) {
  const methods = Array.isArray(allowedMethods) ? allowedMethods : [allowedMethods]
  if (!methods.includes(req.method)) {
    throw new DraftError('HTTP method is not allowed', 405, 'METHOD_NOT_ALLOWED')
  }
}

function validateLeagueSlug (value) {
  if (typeof value !== 'string' || !/^[a-z0-9][a-z0-9-]*$/i.test(value)) {
    throw new DraftError('League slug is invalid', 400, 'INVALID_LEAGUE')
  }
  return value
}

function getLeagueSlug (req) {
  return validateLeagueSlug((req.query && req.query.league) || (req.body && req.body.league))
}

function getViewerFromRequest (req, { captainOnly = req.headers?.['x-draft-viewer'] === 'captain' } = {}) {
  if (req.user && !captainOnly) return { role: 'admin' }
  const identity = req.session && req.session.draftCaptain
  if (!identity || !identity.draftSessionId || !identity.teamId || !Number.isFinite(identity.expiresAt) || identity.expiresAt <= Date.now()) {
    throw new DraftError('Sign in to your team’s draft room', 401, 'NOT_AUTHORIZED')
  }
  return {
    role: 'captain',
    draftSessionId: identity.draftSessionId,
    teamId: identity.teamId
  }
}

function getExpectedVersion (value) {
  const version = Number(value)
  if (!Number.isInteger(version) || version < 1) {
    throw new DraftError('Expected draft version is invalid', 400, 'INVALID_VERSION')
  }
  return version
}

function sendApiError (res, error) {
  const statusCode = error.statusCode || 500
  if (statusCode >= 500) console.error(error)
  return res.status(statusCode).json({
    error: statusCode >= 500 ? 'The draft request could not be completed' : error.message,
    code: error.code || 'INTERNAL_ERROR'
  })
}

module.exports = {
  requireMethod,
  validateLeagueSlug,
  getLeagueSlug,
  getViewerFromRequest,
  getExpectedVersion,
  sendApiError
}
