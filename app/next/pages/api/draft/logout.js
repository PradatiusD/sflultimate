const { endCaptainSession } = require('../../../lib/draft-auth')
const {
  requireMethod,
  getLeagueSlug,
  sendApiError
} = require('../../../lib/draft-api')

export default async function handler (req, res) {
  try {
    requireMethod(req, 'POST')
    getLeagueSlug(req)
    await endCaptainSession(req)
    res.setHeader('Cache-Control', 'no-store')
    return res.status(200).json({ success: true })
  } catch (error) {
    return sendApiError(res, error)
  }
}
