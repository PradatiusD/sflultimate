const { authenticateCaptain, getDraftState } = require('../../../lib/draft-store')
const { startCaptainSession } = require('../../../lib/draft-auth')
const {
  requireMethod,
  getLeagueSlug,
  sendApiError
} = require('../../../lib/draft-api')

export default async function handler (req, res) {
  try {
    requireMethod(req, 'POST')
    const leagueSlug = getLeagueSlug(req)
    const teamSlug = req.body && req.body.team
    const password = req.body && req.body.password
    if (typeof teamSlug !== 'string' || typeof password !== 'string') {
      const error = new Error('Team or password is incorrect')
      error.statusCode = 401
      error.code = 'LOGIN_FAILED'
      throw error
    }

    const identity = await authenticateCaptain(leagueSlug, teamSlug, password)
    const state = await getDraftState(leagueSlug, {
      role: 'captain',
      draftSessionId: identity.draftSessionId,
      teamId: identity.teamId
    })
    await startCaptainSession(req, identity)
    res.setHeader('Cache-Control', 'no-store')
    return res.status(200).json({ state })
  } catch (error) {
    return sendApiError(res, error)
  }
}
