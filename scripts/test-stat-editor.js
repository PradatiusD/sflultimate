const assert = require('assert')
const {
  buildStatEditorUrl,
  getTeamGameDetails,
  mergeSavedStat,
  normalizeStatValue,
  validateGameScores,
  validateTeamStats
} = require('../app/next/lib/stat-editor-utils')

assert.strictEqual(
  buildStatEditorUrl('game id', 'team/id'),
  '/sheets/game%20id/team%2Fid/editor'
)

assert.deepStrictEqual(
  getTeamGameDetails({
    homeTeam: { id: 'home', name: 'Home' },
    awayTeam: { id: 'away', name: 'Away' },
    homeTeamScore: 12,
    awayTeamScore: 10
  }, 'away'),
  {
    isHomeTeam: false,
    team: { id: 'away', name: 'Away' },
    opponent: { id: 'home', name: 'Home' },
    teamScore: 10,
    opponentScore: 12
  }
)
assert.strictEqual(getTeamGameDetails({ homeTeam: { id: 'home' }, awayTeam: { id: 'away' } }, 'other'), null)

assert.strictEqual(normalizeStatValue('3'), 3)
assert.strictEqual(normalizeStatValue(''), 0)
assert.strictEqual(normalizeStatValue('-1'), 0)
assert.strictEqual(normalizeStatValue('2.5'), 0)

assert.deepStrictEqual(
  mergeSavedStat(
    {
      player: { id: 'player-1', firstName: 'Alex', lastName: 'Morgan' },
      gameStatId: null,
      assists: 0,
      scores: 0,
      defenses: 0,
      attended: false
    },
    {
      id: 'stat-1',
      player: { id: 'player-1' },
      assists: 1,
      scores: 1,
      defenses: 2,
      attended: true
    }
  ),
  {
    player: { id: 'player-1', firstName: 'Alex', lastName: 'Morgan' },
    gameStatId: 'stat-1',
    assists: 1,
    scores: 1,
    defenses: 2,
    attended: true
  }
)

assert.deepStrictEqual(validateGameScores(13, 11), [])
assert.deepStrictEqual(validateGameScores(null, 11), ['Enter both final scores before saving.'])
assert.deepStrictEqual(validateGameScores(13, -1), ['Final scores must be whole numbers of zero or more.'])

const validStats = [
  { assists: 2, scores: 1, defenses: 0 },
  { assists: 1, scores: 2, defenses: 3 }
]
assert.deepStrictEqual(validateTeamStats(validStats, 3), {
  errors: [],
  warnings: [],
  totals: { assists: 3, scores: 3, defenses: 3 }
})

assert.deepStrictEqual(
  validateTeamStats(validStats, 4).warnings,
  [
    'Total assists (3) are less than the team score (4).',
    'Total scores (3) are less than the team score (4).'
  ]
)
assert.deepStrictEqual(validateTeamStats(validStats, 4).errors, [])
assert.deepStrictEqual(
  validateTeamStats([{ assists: 4, scores: 3, defenses: 0 }], 3).errors,
  ['Total assists (4) cannot exceed the team score (3).']
)
assert.deepStrictEqual(
  validateTeamStats([{ assists: 3, scores: 4, defenses: 0 }], 3).errors,
  ['Total scores (4) cannot exceed the team score (3).']
)
assert.deepStrictEqual(
  validateTeamStats([{ assists: -1, scores: 0, defenses: 0 }], 3).errors,
  ['Stats must be whole numbers of zero or more.']
)
assert.deepStrictEqual(
  validateTeamStats(validStats, null).errors,
  ['Enter the team score before saving stats.']
)

console.log('Stat editor utility tests passed')
