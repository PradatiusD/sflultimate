const assert = require('assert')
const {
  withDraftLock,
  projectPlayer,
  isValidObjectIdString
} = require('../app/next/lib/draft-store')

async function run () {
  require('dotenv').config({ path: '.env' })
  const lists = require('../app/lists')
  for (const name of ['DraftSession', 'DraftPick', 'DraftCaptainCredential', 'DraftEvent']) {
    assert(lists[name], `${name} must be a registered Keystone list`)
    assert.strictEqual(lists[name].access.read({ authentication: {} }), false)
    assert.strictEqual(lists[name].access.read({ authentication: { item: { id: 'admin' }, listKey: 'User' } }), true)
    for (const operation of ['create', 'update', 'delete']) assert.strictEqual(lists[name].access[operation], false)
  }

  const events = []
  await Promise.all([
    withDraftLock('draft-a', async () => {
      events.push('first:start')
      await new Promise(resolve => setTimeout(resolve, 25))
      events.push('first:end')
    }),
    withDraftLock('draft-a', async () => {
      events.push('second:start')
      events.push('second:end')
    })
  ])
  assert.deepStrictEqual(events, ['first:start', 'first:end', 'second:start', 'second:end'])

  const source = {
    _id: 'player-id',
    firstName: 'Jordan',
    lastName: 'Reyes',
    gender: 'Female',
    age: 29,
    email: 'private@example.com',
    phoneNumber: '555-555-5555',
    comments: 'Useful draft note',
    skillLevel: 8,
    athleticismLevel: 4,
    experienceLevel: 5,
    throwsLevel: 4,
    participation: 80,
    preferredPositions: 'Handler, Hybrid',
    partnerName: 'Taylor',
    willAttendFinals: true
  }
  const captainPlayer = projectPlayer(source, false)
  assert.strictEqual(captainPlayer.email, undefined)
  assert.strictEqual(captainPlayer.phoneNumber, undefined)
  assert.strictEqual(captainPlayer.comments, undefined)
  assert.strictEqual(captainPlayer.firstName, 'Jordan')

  const playerWithComments = projectPlayer(source, true)
  assert.strictEqual(playerWithComments.comments, 'Useful draft note')
  assert.strictEqual(playerWithComments.email, undefined)

  assert.strictEqual(isValidObjectIdString('507f1f77bcf86cd799439011'), true)
  assert.strictEqual(isValidObjectIdString('not-an-id'), false)

  console.log('draft-store: all assertions passed')
}

run().catch(error => {
  console.error(error)
  process.exitCode = 1
})
