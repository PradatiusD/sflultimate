export default class LeagueUtils {
  /**
   * @param {object} league
   * @param {object} [context] Next.js getServerSideProps context
   * @param {boolean} [allowForcePeriod] Opt-in: only the registration/substitution
   *   form pages should pass true here, so `force_period` can't be used to fake
   *   registration status on league-listing/schedule/stats pages.
   */
  static addLeagueStatus (league, context, allowForcePeriod) {
    // `force_period` is a local/testing convenience (like `force_form` and `disable_payment`)
    // that lets Cypress/dev testing pin the registration window without editing DB dates or
    // the system clock. It only works outside production, and only on pages that explicitly
    // opt in via `allowForcePeriod`, so it can never be used to bypass real registration
    // windows or pricing in prod or leak into unrelated pages.
    const forcedPeriod = allowForcePeriod && context && process.env.NODE_ENV !== 'production' ? context.req.query.force_period : undefined

    if (forcedPeriod) {
      league.isEarlyRegistrationPeriod = forcedPeriod === 'early'
      league.isRegistrationPeriod = forcedPeriod === 'regular'
      league.isLateRegistrationPeriod = forcedPeriod === 'late'
    } else {
      league.isEarlyRegistrationPeriod = LeagueUtils.isValidRegPeriod(league.earlyRegistrationStart, league.earlyRegistrationEnd)
      league.isRegistrationPeriod = LeagueUtils.isValidRegPeriod(league.registrationStart, league.registrationEnd)
      league.isLateRegistrationPeriod = LeagueUtils.isValidRegPeriod(league.lateRegistrationStart, league.lateRegistrationEnd)
    }
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
