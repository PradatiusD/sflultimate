function showHourMinute (date) {
  return new Date(date).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', timeZone: 'America/New_York' })
}

function showDate (date) {
  return new Date(date).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' })
}

export {
  showDate,
  showHourMinute
}
