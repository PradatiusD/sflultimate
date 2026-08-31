const {
  getDraftState,
  waitForDraftChange
} = require('../../../lib/draft-store')
const {
  requireMethod,
  getLeagueSlug,
  getViewerFromRequest,
  sendApiError
} = require('../../../lib/draft-api')

export default async function handler (req, res) {
  try {
    requireMethod(req, 'GET')
    const leagueSlug = getLeagueSlug(req)
    const viewer = getViewerFromRequest(req)
    const requestedVersion = Number(req.query.version)
    if (!Number.isInteger(requestedVersion) || requestedVersion < 1) {
      const error = new Error('Draft version is invalid')
      error.statusCode = 400
      error.code = 'INVALID_VERSION'
      throw error
    }

    res.setHeader('Cache-Control', 'no-store')
    let state = await getDraftState(leagueSlug, viewer, { createIfMissing: false })
    if (state.session.version > requestedVersion) {
      return res.status(200).json({ changed: true, state })
    }

    const changePromise = waitForDraftChange(state.session.id, 20000)
    state = await getDraftState(leagueSlug, viewer, { createIfMissing: false })
    if (state.session.version > requestedVersion) {
      return res.status(200).json({ changed: true, state })
    }

    const changed = await changePromise
    if (!changed) return res.status(200).json({ changed: false, version: requestedVersion })
    state = await getDraftState(leagueSlug, viewer, { createIfMissing: false })
    return res.status(200).json({ changed: state.session.version > requestedVersion, state })
  } catch (error) {
    return sendApiError(res, error)
  }
}
