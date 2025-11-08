function showHourMinute (date) {
  return new Date(date).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', timeZone: 'America/New_York' })
}

function showWeekday (date) {
  return new Date(date).toLocaleDateString('en-US', { weekday: 'short', timeZone: 'America/New_York' })
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

function addLeagueToVariables (context, variables = {}) {
  const req = context && context.req
  const isArchivedLeague = context && req.url.startsWith('/leagues/')
  if (isArchivedLeague) {
    const leagueSlug = req.url.split('/')[2]
    variables.leagueCriteria = {
      slug: leagueSlug
    }
  } else if (req.query.leagueId) {
    variables.leagueCriteria = {
      id: req.query.leagueId
    }
  } else {
    variables.leagueCriteria = {
      isActive: true
    }
  }
  return variables
}

function createSummary (entry, numCharsLimit) {
  if (entry.summary) {
    return entry.summary
  }
  // remove html tags
  const string = entry.description.replace(/<.*?>/g, '')

  // split into words
  const arr = string.split(/\s/g)

  let finalStr = ''
  for (let i = 0; i < arr.length; i++) {
    const isTooBig = arr[i].length + finalStr.length > numCharsLimit
    finalStr += arr[i] + (isTooBig ? '...' : ' ')
    if (isTooBig) {
      break
    }
  }

  return finalStr
}

export {
  showDate,
  showWeekday,
  showHourMinute,
  getMongoTimestamp,
  addLeagueToVariables,
  createSummary
}
