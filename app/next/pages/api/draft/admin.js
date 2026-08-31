const {
  getDraftState,
  setCaptainPassword,
  performAdminAction,
  pickPlayer,
  undoLastPick
} = require('../../../lib/draft-store')
const {
  requireMethod,
  getLeagueSlug,
  getExpectedVersion,
  sendApiError
} = require('../../../lib/draft-api')

const ACTIONS = new Set([
  'setPassword',
  'start',
  'pause',
  'resume',
  'complete',
  'setNextTeam',
  'settings',
  'pick',
  'undo'
])

export default async function handler (req, res) {
  try {
    requireMethod(req, 'POST')
    if (!req.user) {
      const error = new Error('Not authorized')
      error.statusCode = 401
      error.code = 'NOT_AUTHORIZED'
      throw error
    }
    const leagueSlug = getLeagueSlug(req)
    const action = req.body && req.body.action
    if (!ACTIONS.has(action)) {
      const error = new Error('Admin action is invalid')
      error.statusCode = 400
      error.code = 'INVALID_ACTION'
      throw error
    }

    if (action === 'setPassword') {
      await setCaptainPassword(leagueSlug, req.body.teamId, req.body.password)
    } else if (action === 'pick') {
      const state = await pickPlayer(leagueSlug, {
        playerId: req.body.playerId,
        teamId: req.body.teamId,
        advanceOrder: req.body.advanceOrder,
        overrideNote: req.body.overrideNote,
        expectedVersion: getExpectedVersion(req.body.expectedVersion)
      }, { role: 'admin' })
      return res.status(200).json({ state })
    } else if (action === 'undo') {
      const state = await undoLastPick(leagueSlug, getExpectedVersion(req.body.expectedVersion))
      return res.status(200).json({ state })
    } else {
      await performAdminAction(leagueSlug, action, {
        expectedVersion: getExpectedVersion(req.body.expectedVersion),
        teamId: req.body.teamId || null,
        showCommentsToCaptains: req.body.showCommentsToCaptains
      })
    }

    const state = await getDraftState(leagueSlug, { role: 'admin' }, { createIfMissing: true })
    return res.status(200).json({ state })
  } catch (error) {
    return sendApiError(res, error)
  }
}
