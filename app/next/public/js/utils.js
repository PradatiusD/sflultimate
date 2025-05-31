window.sflUtils = {
  /**
   *
   * @param {string} url
   * @return {string}
   */
  addLeagueOverride (url) {
    const queryParams = new URLSearchParams(window.location.search)
    const forceKey = 'set_league_id'
    const queryParamValue = queryParams.get(forceKey)
    if (queryParamValue) {
      const startChar = url.includes('?') ? '&' : '?'
      url += startChar + forceKey + '=' + queryParamValue
    }
    return url
  },
  buildPlayerUrl (player) {
    return ('/players/' + player.name.first + ' ' + player.name.last).trim().replace(/\s/g, '-').toLowerCase()
  }
}
