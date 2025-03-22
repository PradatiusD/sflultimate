function showHourMinute (date) {
  return new Date(date).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', timeZone: 'America/New_York' })
}

function showDate (date) {
  return new Date(date).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' })
}

function getMongoTimestamp (id) {
  return new Date(parseInt(id.substring(0, 8), 16) * 1000)
}

export {
  showDate,
  showHourMinute,
  getMongoTimestamp
}
