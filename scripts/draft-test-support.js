const assert = require('assert')
const crypto = require('crypto')
const { Keystone } = require('@keystonejs/keystone')
const { MongooseAdapter } = require('@keystonejs/adapter-mongoose')

async function connect (mongoUri) {
  const uri = new URL(mongoUri)
  assert(uri.protocol === 'mongodb:' && ['127.0.0.1', 'localhost', '[::1]'].includes(uri.hostname) && !uri.username && !uri.password && !uri.search, 'Fixtures require a single local MongoDB URI without credentials or options')
  process.env.MONGOLAB_URI = mongoUri
  process.env.S3_BUCKET = process.env.S3_BUCKET || 'unused-draft-test-bucket'
  const keystone = new Keystone({ adapter: new MongooseAdapter({ mongoUri }), cookieSecret: crypto.randomBytes(32).toString('hex') })
  for (const [name, schema] of Object.entries(require('../app/lists'))) keystone.createList(name, schema)
  keystone.createApolloServer({ schemaName: 'public' })
  await keystone.connect()
  global.sflKeystone = keystone
  return keystone
}

function crud (keystone) {
  const context = () => keystone.createContext().sudo()
  return {
    create: (name, data) => keystone.lists[name].createMutation(data, context()),
    update: (name, id, data) => keystone.lists[name].updateMutation(String(id), data, context()),
    remove: (name, id) => keystone.lists[name].deleteMutation(String(id), context()),
    find: (name, where) => keystone.lists[name].listQuery({ where }, context())
  }
}

async function seed (keystone, { slug, teamSlugs, password = 'draft-browser-password' }) {
  const api = crud(keystone)
  assert.strictEqual((await api.find('League', { slug })).length, 0, 'Refusing to overwrite an existing league')
  const fixture = { slug, leagueId: null, teamIds: [], playerIds: [], draftSessionId: null }
  try {
    const league = await api.create('League', { name: slug, title: 'Disposable Draft Test', slug, registrationStart: '2026-01-01T00:00:00.000Z' })
    fixture.leagueId = String(league.id)
    for (const [index, teamSlug] of teamSlugs.entries()) {
      const team = await api.create('Team', { name: ['Test Flamingos', 'Test Waves', 'Test Stars'][index], slug: teamSlug, league: { connect: { id: fixture.leagueId } }, draftOrder: index + 1, color: '#804399' })
      fixture.teamIds.push(String(team.id))
    }
    for (let index = 0; index < 4; index++) {
      const player = await api.create('Player', {
        name: `Draft Fixture Player ${index}`,
        firstName: 'Fixture',
        lastName: `Player ${index}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        gender: index % 2 ? 'Male' : 'Female',
        age: 25,
        email: `fixture-${index}@example.invalid`,
        registrationLevel: 'Adult',
        skillLevel: 7 - index,
        participation: 80,
        comments: 'Private fixture note',
        leagues: { connect: [{ id: fixture.leagueId }] }
      })
      fixture.playerIds.push(String(player.id))
    }
    const store = require('../app/next/lib/draft-store')
    const { session } = await store.getOrCreateDraft(slug)
    fixture.draftSessionId = String(session.id)
    for (const teamId of fixture.teamIds) await store.setCaptainPassword(slug, teamId, password)
    await store.performAdminAction(slug, 'start', { expectedVersion: session.version })
    return fixture
  } catch (error) {
    console.error('Fixture setup failed:', error)
    await cleanup(keystone, fixture)
    throw error
  }
}

async function cleanup (keystone, fixture) {
  const api = crud(keystone)
  // Only explicit IDs created by this run/manifest; never delete by a broad slug.
  if (fixture.draftSessionId) {
    for (const name of ['DraftEvent', 'DraftPick', 'DraftCaptainCredential']) {
      const records = await api.find(name, { draftSessionId: { id: fixture.draftSessionId } })
      for (const record of records) await api.remove(name, record.id)
    }
    await api.remove('DraftSession', fixture.draftSessionId)
  }
  if (fixture.adminId) await api.remove('User', fixture.adminId)
  for (const id of fixture.teamIds) await api.remove('Team', id)
  for (const id of fixture.playerIds) await api.remove('Player', id)
  if (fixture.leagueId) await api.remove('League', fixture.leagueId)
}

module.exports = { connect, crud, seed, cleanup }
