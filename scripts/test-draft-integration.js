const assert = require('assert')
const crypto = require('crypto')
const { connect, crud, seed, cleanup } = require('./draft-test-support')
const { fork } = require('child_process')
const store = require('../app/next/lib/draft-store')

async function startWorker (mongoUri) {
  const worker = fork(__filename, ['pick-worker', mongoUri], { stdio: ['ignore', 'inherit', 'inherit', 'ipc'] })
  await new Promise((resolve, reject) => {
    worker.once('message', resolve)
    worker.once('error', reject)
    worker.once('exit', code => reject(new Error(`Pick worker exited early: ${code}`)))
  })
  return request => new Promise((resolve, reject) => {
    worker.once('message', result => {
      worker.once('exit', () => result.ok ? resolve(result.state) : reject(Object.assign(new Error(result.message), { code: result.code })))
    })
    worker.send(request)
  })
}

async function runWorker () {
  const keystone = await connect(process.argv[3])
  process.send({ ready: true })
  process.once('message', async ({ slug, payload, actor }) => {
    try {
      const state = await store.pickPlayer(slug, payload, actor)
      process.send({ ok: true, state })
    } catch (error) {
      process.send({ ok: false, code: error.code, message: error.message })
    } finally {
      await keystone.disconnect()
      process.disconnect()
    }
  })
}

async function run () {
  // Never load .env or use the application's dataset for storage integration.
  const suffix = crypto.randomBytes(8).toString('hex')
  const keystone = await connect(`mongodb://127.0.0.1:27017/draft_test_${suffix}`)
  const api = crud(keystone)
  let fixture
  let other
  try {
    fixture = await seed(keystone, { slug: `draft-test-${suffix}`, teamSlugs: ['same-slug', 'team-b', 'team-c'] })
    for (const [name, collection] of Object.entries({ DraftSession: 'draft_sessions', DraftPick: 'draft_picks', DraftCaptainCredential: 'draft_captain_credentials', DraftEvent: 'draft_events' })) {
      assert.strictEqual(keystone.lists[name].adapter.model.collection.name, collection)
    }
    const pickIndexes = await keystone.lists.DraftPick.adapter.model.collection.indexes()
    assert(pickIndexes.some(index => index.unique && index.key.draftSessionId === 1 && index.key.playerId === 1))
    assert(pickIndexes.some(index => index.unique && index.key.draftSessionId === 1 && index.key.selectionNumber === 1))
    other = await seed(keystone, { slug: `draft-other-${suffix}`, teamSlugs: ['same-slug', 'other-b'] })
    const { slug, teamIds, playerIds, draftSessionId } = fixture
    const identity = await store.authenticateCaptain(slug, 'same-slug', 'draft-browser-password')
    assert.strictEqual(identity.teamId, teamIds[0])
    assert.strictEqual((await store.authenticateCaptain(other.slug, 'same-slug', 'draft-browser-password')).teamId, other.teamIds[0])
    assert.strictEqual((await store.getCaptainPageInfo(other.slug, 'same-slug')).team.id, other.teamIds[0])
    await assert.rejects(store.getCaptainPageInfo(slug, other.teamIds[0]), error => error.code === 'TEAM_NOT_FOUND')
    const captain = { role: 'captain', ...identity }
    let state = await store.getDraftState(slug, { role: 'admin' })
    assert.strictEqual(state.availablePlayers.length, 4)
    await assert.rejects(store.getDraftState(slug, { role: 'captain', ...identity, draftSessionId: other.draftSessionId }), error => error.code === 'NOT_AUTHORIZED')
    await assert.rejects(store.pickPlayer(slug, { playerId: playerIds[0], expectedVersion: state.session.version }, { role: 'captain', ...identity, draftSessionId: other.draftSessionId }), error => error.code === 'NOT_AUTHORIZED')

    // Real database claim held by another process prevents every write.
    const model = keystone.lists.DraftSession.adapter.model
    await model.updateOne({ _id: draftSessionId }, { $set: { operationToken: 'simulated-other-worker' } })
    await assert.rejects(store.pickPlayer(slug, { playerId: playerIds[0], expectedVersion: state.session.version }, captain), error => error.code === 'DRAFT_BUSY')
    assert.strictEqual((await api.find('DraftPick', {})).length, 0)
    await model.updateOne({ _id: draftSessionId }, { $unset: { operationToken: 1 } })

    const workerPick = await startWorker(`mongodb://127.0.0.1:27017/draft_test_${suffix}`)
    const results = await Promise.allSettled([
      workerPick({ slug, payload: { playerId: playerIds[0], expectedVersion: state.session.version }, actor: captain }),
      store.pickPlayer(slug, { playerId: playerIds[1], expectedVersion: state.session.version }, captain)
    ])
    assert.strictEqual(results.filter(result => result.status === 'fulfilled').length, 1, results.map(result => result.reason?.stack || 'fulfilled').join('\n'))
    assert.strictEqual(results.filter(result => result.status === 'rejected').length, 1)
    state = await store.getDraftState(slug, { role: 'admin' })
    assert.strictEqual(state.picks.length, 1)
    assert.strictEqual(state.teams[0].roster.length, 1)
    assert.strictEqual(state.session.currentTeamId, teamIds[1])
    await assert.rejects(store.pickPlayer(slug, { playerId: playerIds[2], expectedVersion: state.session.version }, captain), error => error.code === 'OUT_OF_TURN')
    state = await store.pickPlayer(slug, { playerId: playerIds[2], teamId: teamIds[2], expectedVersion: state.session.version }, { role: 'admin' })
    assert.strictEqual(state.picks[1].isCommissionerOverride, true)
    state = await store.pickPlayer(slug, { playerId: playerIds[3], teamId: teamIds[0], advanceOrder: false, expectedVersion: state.session.version }, { role: 'admin' })
    assert.strictEqual(state.session.currentPickNumber, 2)
    state = await store.undoLastPick(slug, state.session.version)
    assert(state.availablePlayers.some(player => player.id === playerIds[3]))
    await store.performAdminAction(slug, 'setNextTeam', { teamId: teamIds[0], expectedVersion: state.session.version })
    state = await store.getDraftState(slug, captain)
    assert.strictEqual(state.session.currentTeamId, teamIds[0])
    assert.strictEqual(state.availablePlayers[0].comments, undefined)
    assert.strictEqual(state.teams[0].captainPasswordSet, undefined)
    assert(!JSON.stringify(state).includes('Private fixture note'))

    // Legacy documents keep their original collection, IDs and ordered array.
    await model.updateOne({ _id: draftSessionId }, { $unset: { orderJson: 1 }, $set: { teamOrder: teamIds } })
    state = await store.getDraftState(slug, { role: 'admin' })
    assert.deepStrictEqual(state.teams.map(team => team.id), teamIds)
    assert.strictEqual(state.picks.length, 2)

    // An audit-write failure after the pick and relationship writes must never
    // roll those committed writes back or let another worker continue blindly.
    const eventList = keystone.lists.DraftEvent
    const createEvent = eventList.createMutation
    eventList.createMutation = async () => { throw new Error('Injected audit failure') }
    try {
      await assert.rejects(store.pickPlayer(slug, { playerId: playerIds[3], expectedVersion: state.session.version }, captain), /Injected audit failure/)
    } finally {
      eventList.createMutation = createEvent
    }
    assert((await model.findById(draftSessionId).lean()).operationToken)
    assert.strictEqual((await api.find('DraftPick', { draftSessionId: { id: draftSessionId } })).length, 3)
    await assert.rejects(store.getDraftState(slug, captain), error => error.code === 'DRAFT_BUSY')
    await assert.rejects(store.undoLastPick(slug, state.session.version), error => error.code === 'DRAFT_BUSY')

    const unauthenticated = keystone.createContext()
    for (const name of ['DraftSession', 'DraftPick', 'DraftCaptainCredential', 'DraftEvent']) {
      await assert.rejects(keystone.lists[name].listQuery({ where: {} }, unauthenticated))
      await assert.rejects(keystone.lists[name].createMutation({}, unauthenticated))
    }
    console.log('draft integration: Keystone CRUD, relationships, legacy compatibility, scoped slugs, authorization, privacy, concurrent picks, override and undo passed')
  } finally {
    if (fixture) await cleanup(keystone, fixture)
    if (other) await cleanup(keystone, other)
    for (const name of ['League', 'Team', 'Player', 'DraftSession', 'DraftPick', 'DraftCaptainCredential', 'DraftEvent']) assert.strictEqual((await api.find(name, {})).length, 0, `${name} fixture cleanup`)
    await keystone.disconnect()
  }
}

const task = process.argv[2] === 'pick-worker' ? runWorker : run
task().catch(error => { console.error(error); process.exit(1) })
