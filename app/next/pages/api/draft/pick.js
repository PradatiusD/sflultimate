const { pickPlayer } = require('../../../lib/draft-store')
const {
  requireMethod,
  getLeagueSlug,
  getViewerFromRequest,
  getExpectedVersion,
  sendApiError
} = require('../../../lib/draft-api')

export default async function handler (req, res) {
  try {
    requireMethod(req, 'POST')
    const leagueSlug = getLeagueSlug(req)
    const viewer = getViewerFromRequest(req)
    const payload = {
      playerId: req.body && req.body.playerId,
      teamId: req.body && req.body.teamId,
      advanceOrder: req.body && req.body.advanceOrder,
      overrideNote: req.body && req.body.overrideNote,
      expectedVersion: getExpectedVersion(req.body && req.body.expectedVersion)
    }
    const state = await pickPlayer(leagueSlug, payload, viewer)
    return res.status(200).json({ state })
  } catch (error) {
    return sendApiError(res, error)
  }
}
