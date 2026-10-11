/* global db, ObjectId, print, APPLY_SCHEDULE */
/**
 * Run in mongosh with the intended database selected. Preview by default:
 *   load('scripts/complete-fall-2026-schedule.js')
 * To insert after reviewing the preview (do not run concurrently):
 *   globalThis.APPLY_SCHEDULE = true
 *   load('scripts/complete-fall-2026-schedule.js')
 *   globalThis.APPLY_SCHEDULE = false
 * Existing games are never updated. Exact matches are skipped on reruns.
 */
(function () {
  const league = ObjectId('6a87a3131656d6002824c96a')
  const teams = [
    ObjectId('6ac95e73dc57b200289cd69e'), // Kumiko & Michael
    ObjectId('6ac95e86dc57b200289cd8d6'), // Puma & Rey
    ObjectId('6ac95e92dc57b200289cda7f'), // Milena & Santi
    ObjectId('6ac95ea5dc57b200289cdc5f') // Lina & Lucas
  ]
  // Each pair is [home, away]; first two games at 3 PM, last two at 4:45 PM.
  // Six more Sundays, excluding November 29 (Thanksgiving weekend).
  const weeks = [
    ['2026-10-18', '-04:00', [[0, 3], [1, 2], [0, 1], [2, 3]]],
    ['2026-10-25', '-04:00', [[0, 2], [1, 3], [3, 0], [2, 1]]],
    ['2026-11-01', '-05:00', [[1, 0], [3, 2], [2, 0], [3, 1]]],
    ['2026-11-08', '-05:00', [[0, 3], [1, 2], [1, 0], [2, 3]]],
    ['2026-11-15', '-05:00', [[0, 2], [1, 3], [3, 0], [2, 1]]],
    ['2026-11-22', '-05:00', [[1, 0], [3, 2], [2, 0], [3, 1]]]
  ]
  function buildGames (date, offset, matchups) {
    return matchups.map(([home, away], index) => ({
      league,
      homeTeam: teams[home],
      awayTeam: teams[away],
      scheduledTime_utc: new Date(`${date}T${index < 2 ? '15:00' : '16:45'}:00${offset}`),
      scheduledTime_offset: offset,
      __v: 0
    }))
  }
  function key (game) {
    return [game.scheduledTime_utc.toISOString(), game.homeTeam.toString(), game.awayTeam.toString()].join('|')
  }
  if (!db.leagues.findOne({ _id: league })) throw new Error('League not found in selected database')
  const teamRecords = db.teams.find({ _id: { $in: teams } }, { name: 1 }).toArray()
  if (teamRecords.length !== 4) throw new Error('Expected all four teams in selected database')
  const names = Object.fromEntries(teamRecords.map(team => [team._id.toString(), team.name]))
  const planned = weeks.flatMap(([date, offset, matchups]) => buildGames(date, offset, matchups))
  const opening = buildGames('2026-10-11', '-04:00', [[0, 1], [2, 3], [3, 1], [0, 2]])
  const expectedKeys = new Set([...opening, ...planned].map(key))
  const existing = db.games.find({ league }).toArray()
  const existingKeys = new Set(existing.map(key))
  if (existingKeys.size !== existing.length || existing.some(game => !expectedKeys.has(key(game)))) {
    throw new Error('Unexpected or duplicate league games; review schedule before inserting')
  }
  if (opening.some(game => !existingKeys.has(key(game)))) throw new Error('Opening-day schedule has changed')
  const missing = planned.filter(game => !existingKeys.has(key(game)))
  const format = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York', dateStyle: 'medium', timeStyle: 'short'
  })
  print(`Database: ${db.getName()}; league: ${league}`)
  missing.forEach(game => print(`${format.format(game.scheduledTime_utc)} ET | HOME ${names[game.homeTeam.toString()]} vs AWAY ${names[game.awayTeam.toString()]}`))
  print(`${planned.length} planned; ${planned.length - missing.length} already present; ${missing.length} to insert`)
  if (typeof APPLY_SCHEDULE === 'undefined' || APPLY_SCHEDULE !== true) {
    print('PREVIEW ONLY: no writes. Set globalThis.APPLY_SCHEDULE = true to insert.')
    return
  }
  if (missing.length) db.games.insertMany(missing, { ordered: true })
  const saved = db.games.find({ league }).toArray()
  const savedKeys = new Set(saved.map(key))
  if (saved.length !== expectedKeys.size || [...expectedKeys].some(value => !savedKeys.has(value))) {
    throw new Error('Post-insert verification failed; inspect league games before rerunning')
  }
  print(`Verified ${saved.length} season games. Inserted ${missing.length}; existing games unchanged.`)
})()
