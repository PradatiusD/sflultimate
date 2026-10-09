const fs = require('fs')
const os = require('os')
const path = require('path')
const assert = require('assert')
const crypto = require('crypto')
const { connect, crud, seed, cleanup } = require('./draft-test-support')

// Explicit target only. Use the running app's resolved local URI, or start the
// app on a disposable database. No .env fallback and no hardcoded real database.
const mongoUri = process.env.DRAFT_FIXTURE_MONGO_URI
const manifestPath = process.env.DRAFT_FIXTURE_MANIFEST || path.join(os.tmpdir(), 'sfl-draft-browser-fixture.json')
const slug = process.env.DRAFT_FIXTURE_SLUG || 'draft-browser-test'
const targetHash = value => crypto.createHash('sha256').update(value).digest('hex')

async function run () {
  assert(mongoUri, 'Set DRAFT_FIXTURE_MONGO_URI to the exact local database URI used by the running app')
  assert(new URL(mongoUri).pathname.startsWith('/draft_browser_'), 'Browser fixtures with an administrator require an isolated draft_browser_* database')
  assert(['seed', 'cleanup'].includes(process.argv[2]), 'Use seed or cleanup')
  const keystone = await connect(mongoUri)
  try {
    if (process.argv[2] === 'seed') {
      assert(!fs.existsSync(manifestPath), 'Fixture manifest exists: cleanup that exact fixture first')
      const fixture = await seed(keystone, { slug, teamSlugs: ['draft-browser-team-a', 'draft-browser-team-b'] })
      try {
        const admin = await crud(keystone).create('User', {
          firstName: 'Fixture', lastName: 'Commissioner', email: 'draft-commissioner@example.invalid', password: 'draft-commissioner-password'
        })
        fixture.adminId = String(admin.id)
        fs.writeFileSync(manifestPath, JSON.stringify({ ...fixture, targetHash: targetHash(mongoUri) }), { flag: 'wx', mode: 0o600 })
      } catch (error) {
        await cleanup(keystone, fixture)
        throw error
      }
      const state = await require('../app/next/lib/draft-store').getDraftState(slug, { role: 'admin' })
      assert.strictEqual(state.session.status, 'active')
      assert.strictEqual(state.availablePlayers.length, fixture.playerIds.length)
      console.log(`Seeded disposable fixture ${slug}; manifest: ${manifestPath}`)
    } else {
      const fixture = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
      assert.strictEqual(fixture.targetHash, targetHash(mongoUri), 'Manifest belongs to a different database')
      const api = crud(keystone)
      const league = (await api.find('League', { id: fixture.leagueId }))[0]
      assert(!league || (league.slug === fixture.slug && league.title === 'Disposable Draft Test'), 'Fixture ownership check failed')
      await cleanup(keystone, fixture)
      assert.strictEqual((await api.find('League', { id: fixture.leagueId })).length, 0)
      assert.strictEqual((await api.find('Team', { id_in: fixture.teamIds })).length, 0)
      assert.strictEqual((await api.find('Player', { id_in: fixture.playerIds })).length, 0)
      fs.unlinkSync(manifestPath)
      console.log(`Removed only the disposable fixture ${fixture.slug}`)
    }
  } finally {
    await keystone.disconnect()
  }
}

run().catch(error => { console.error(error); process.exit(1) })
