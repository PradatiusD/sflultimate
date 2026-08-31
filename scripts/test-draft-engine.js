const assert = require('assert')
const {
  getSnakeTeamId,
  getDraftPosition,
  getUpcomingTeamIds,
  advanceDraftPosition
} = require('../app/next/lib/draft-engine')

const teams = ['a', 'b', 'c']

assert.deepStrictEqual(
  Array.from({ length: 9 }, (_, pick) => getSnakeTeamId(teams, pick)),
  ['a', 'b', 'c', 'c', 'b', 'a', 'a', 'b', 'c']
)

assert.deepStrictEqual(getDraftPosition(teams, 4, null), {
  pickNumber: 4,
  roundNumber: 2,
  direction: 'reverse',
  suggestedTeamId: 'b',
  currentTeamId: 'b',
  isOverride: false
})

assert.deepStrictEqual(getDraftPosition(teams, 4, 'c'), {
  pickNumber: 4,
  roundNumber: 2,
  direction: 'reverse',
  suggestedTeamId: 'b',
  currentTeamId: 'c',
  isOverride: true
})

assert.deepStrictEqual(getUpcomingTeamIds(teams, 1, null, 5), ['b', 'c', 'c', 'b', 'a'])
assert.deepStrictEqual(getUpcomingTeamIds(teams, 1, 'a', 4), ['a', 'c', 'c', 'b'])

assert.deepStrictEqual(
  advanceDraftPosition({ currentPickNumber: 2, nextTeamOverrideId: 'a' }, true),
  { currentPickNumber: 3, nextTeamOverrideId: null }
)
assert.deepStrictEqual(
  advanceDraftPosition({ currentPickNumber: 2, nextTeamOverrideId: 'a' }, false),
  { currentPickNumber: 2, nextTeamOverrideId: 'a' }
)

assert.throws(() => getSnakeTeamId([], 0), /team order/i)
assert.throws(() => getSnakeTeamId(teams, -1), /pick number/i)
assert.throws(() => getDraftPosition(teams, 0, 'missing'), /override team/i)

console.log('draft-engine: all assertions passed')
