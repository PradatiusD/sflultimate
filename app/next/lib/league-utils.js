export default class LeagueUtils {
  static addLeagueStatus (league, context) {
    league.isEarlyRegistrationPeriod = LeagueUtils.isValidRegPeriod(league.earlyRegistrationStart, league.earlyRegistrationEnd)
    league.isRegistrationPeriod = LeagueUtils.isValidRegPeriod(league.registrationStart, league.registrationEnd)
    league.isLateRegistrationPeriod = LeagueUtils.isValidRegPeriod(league.lateRegistrationStart, league.lateRegistrationEnd) // || (req.query.force_form === 'true'
    league.canRegister = !!(league.isEarlyRegistrationPeriod || league.isRegistrationPeriod || league.isLateRegistrationPeriod || (context && context.req.query.force_form === 'true'))
  }

  /**
   *
   * @param {Date} regStart
   * @param {Date} regEnd
   * @return {boolean}
   */
  static isValidRegPeriod (regStart, regEnd) {
    const now = Date.now()
    if (regStart && regEnd) {
      regStart = new Date(regStart)
      regEnd = new Date(regEnd)
    }
    return !!(regStart && regEnd && regStart.getTime() < now && now < regEnd.getTime())
  }
}
