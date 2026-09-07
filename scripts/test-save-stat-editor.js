const assert = require('assert')

async function run () {
  const { saveStatEditor } = require('../app/next/lib/save-stat-editor')
  const operations = []
  const client = {
    mutate: async options => {
      operations.push(options)
      if (options.variables.id === 'existing-stat') {
        return { data: { updatePlayerGameStat: { id: 'existing-stat', player: { id: 'player-1' } } } }
      }
      if (options.variables.data && options.variables.data.player) {
        return { data: { createPlayerGameStat: { id: 'new-stat', player: { id: 'player-2' } } } }
      }
      return { data: { updateGame: { id: 'game-1' } } }
    }
  }

  const result = await saveStatEditor({
    gameId: 'game-1',
    gameData: { homeTeamScore: 15, awayTeamScore: 12 },
    stats: [
      { gameStatId: 'existing-stat', playerId: 'player-1', assists: 2, scores: 3, defenses: 1, attended: true },
      { gameStatId: null, playerId: 'player-2', assists: 1, scores: 2, defenses: 0, attended: true }
    ]
  }, client)

  assert.strictEqual(operations.length, 3)
  assert.deepStrictEqual(operations[0].variables, {
    id: 'game-1',
    data: { homeTeamScore: 15, awayTeamScore: 12 }
  })
  assert.strictEqual(operations[1].variables.id, 'existing-stat')
  assert.deepStrictEqual(operations[2].variables.data.player, { connect: { id: 'player-2' } })
  assert.deepStrictEqual(operations[2].variables.data.game, { connect: { id: 'game-1' } })
  assert.deepStrictEqual(result, [
    { id: 'existing-stat', player: { id: 'player-1' } },
    { id: 'new-stat', player: { id: 'player-2' } }
  ])

  console.log('save-stat-editor tests passed')
}

run().catch(error => {
  console.error(error)
  process.exitCode = 1
})
