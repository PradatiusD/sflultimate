function showHourMinute (date) {
  return new Date(date).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', timeZone: 'America/New_York' })
}

function showWeekday (date) {
  return new Date(date).toLocaleDateString('en-US', { weekday: 'short',  timeZone: 'America/New_York' })
}

function showDate (date, options) {
  const localeDefault = {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'America/New_York'
  }
  if (!options) {
    options = localeDefault
  } else {
    if (!options.timeZone) {
      options.timeZone = localeDefault.timeZone
    }
  }
  return new Date(date).toLocaleDateString('en-US', options)
}

function getMongoTimestamp (id) {
  return new Date(parseInt(id.substring(0, 8), 16) * 1000)
}

function addLeagueToVariables (context, variables) {
  const isArchivedLeague = context && context.req.url.startsWith('/leagues/')
  if (isArchivedLeague) {
    let leagueSlug = context.req.url.split('/')[2].replace(/-/g, ' ').replace(/'/g, '')
    leagueSlug = leagueSlug.replace('mini ', 'mini-')
    variables.leagueCriteria = {
      title_i: leagueSlug
    }
  } else {
    variables.leagueCriteria = {
      isActive: true
    }
  }
  return variables
}

export {
  showDate,
  showWeekday,
  showHourMinute,
  getMongoTimestamp,
  addLeagueToVariables
}
