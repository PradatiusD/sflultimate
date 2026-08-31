const { clearCaptainCookie } = require('../../../lib/draft-auth')
const {
  requireMethod,
  getLeagueSlug,
  getCaptainCookiePath,
  sendApiError
} = require('../../../lib/draft-api')

export default async function handler (req, res) {
  try {
    requireMethod(req, 'POST')
    const leagueSlug = getLeagueSlug(req)
    const secure = process.env.NODE_ENV === 'production' || req.headers['x-forwarded-proto'] === 'https'
    res.setHeader('Set-Cookie', clearCaptainCookie(getCaptainCookiePath(leagueSlug), secure))
    return res.status(200).json({ success: true })
  } catch (error) {
    return sendApiError(res, error)
  }
}
