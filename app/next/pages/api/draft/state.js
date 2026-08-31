const { getDraftState } = require('../../../lib/draft-store')
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
    const state = await getDraftState(leagueSlug, viewer, {
      createIfMissing: viewer.role === 'admin'
    })
    res.setHeader('Cache-Control', 'no-store')
    return res.status(200).json({ state })
  } catch (error) {
    return sendApiError(res, error)
  }
}
