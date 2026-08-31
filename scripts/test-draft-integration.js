const assert = require('assert')
const mongodb = require('mongodb')
const { ObjectId } = mongodb
require('dotenv').config({ path: '.env' })

if (!process.env.MONGOLAB_URI || !/(localhost|127\.0\.0\.1)/.test(process.env.MONGOLAB_URI)) {
  console.error('draft integration test refused: MONGOLAB_URI must point to localhost')
  process.exit(1)
}
process.env.DRAFT_SESSION_SECRET = 'local-draft-integration-test-secret'

const store = require('../app/next/lib/draft-store')

async function run () {
  const client = await mongodb.connect(process.env.MONGOLAB_URI.replace('/sflultimate', '/sflultimateV5'), { useUnifiedTopology: true })
  const db = client.db('sflultimateV5')
  const suffix = new ObjectId().toString()
  const leagueId = new ObjectId()
  const teamIds = [new ObjectId(), new ObjectId(), new ObjectId()]
  const playerIds = [new ObjectId(), new ObjectId(), new ObjectId(), new ObjectId()]
  const slug = `draft-test-${suffix}`
  let draftSessionId

  try {
    await db.collection('leagues').insertOne({ _id: leagueId, name: slug, title: 'Draft Integration Test', slug })
    await db.collection('teams').insertMany(teamIds.map((id, index) => ({
      _id: id,
      name: `Test Team ${index + 1}`,
      slug: `test-team-${index + 1}-${suffix}`,
      league: leagueId,
      draftOrder: index + 1,
      color: '#804399'
    })))
    await db.collection('players').insertMany(playerIds.map((id, index) => ({
      _id: id,
      firstName: 'Draft',
      lastName: `Player ${index + 1}`,
      name: `Draft Player ${index + 1}`,
      gender: index % 2 ? 'Male' : 'Female',
      age: 25,
      skillLevel: 7 - index,
      participation: 80,
      comments: `Private note ${index + 1}`
    })))
    await db.collection('player_leagues_manies').insertMany(playerIds.map(id => ({ Player_left_id: id, League_right_id: leagueId })))

    let state = await store.getDraftState(slug, { role: 'admin' }, { createIfMissing: true })
    draftSessionId = new ObjectId(state.session.id)
    assert.strictEqual(state.session.currentTeamId, teamIds[0].toString())
    assert.strictEqual(state.availablePlayers.length, 4)

    for (let index = 0; index < teamIds.length; index++) {
      await store.setCaptainPassword(slug, teamIds[index].toString(), `captain-${index + 1}-password`)
    }
    const identity = await store.authenticateCaptain(slug, `test-team-1-${suffix}`, 'captain-1-password')
    assert.strictEqual(identity.teamId, teamIds[0].toString())

    state = await store.getDraftState(slug, { role: 'admin' })
    await store.performAdminAction(slug, 'start', { expectedVersion: state.session.version })
    state = await store.getDraftState(slug, { role: 'admin' })

    state = await store.pickPlayer(slug, {
      playerId: playerIds[0].toString(),
      expectedVersion: state.session.version
    }, { role: 'captain', teamId: teamIds[0].toString() })
    assert.strictEqual(state.session.currentTeamId, teamIds[1].toString())
    assert.strictEqual(state.teams[0].roster.some(player => player.id === playerIds[0].toString()), true)

    await assert.rejects(
      () => store.pickPlayer(slug, {
        playerId: playerIds[1].toString(),
        expectedVersion: state.session.version
      }, { role: 'captain', teamId: teamIds[0].toString() }),
      error => error.code === 'OUT_OF_TURN'
    )

    state = await store.pickPlayer(slug, {
      playerId: playerIds[1].toString(),
      teamId: teamIds[2].toString(),
      advanceOrder: true,
      overrideNote: 'Special consideration',
      expectedVersion: state.session.version
    }, { role: 'admin' })
    assert.strictEqual(state.session.currentTeamId, teamIds[2].toString())
    assert.strictEqual(state.picks[1].isCommissionerOverride, true)

    state = await store.pickPlayer(slug, {
      playerId: playerIds[2].toString(),
      teamId: teamIds[0].toString(),
      advanceOrder: false,
      overrideNote: 'Makeup pick',
      expectedVersion: state.session.version
    }, { role: 'admin' })
    assert.strictEqual(state.session.currentTeamId, teamIds[2].toString())
    assert.strictEqual(state.session.currentPickNumber, 2)

    state = await store.undoLastPick(slug, state.session.version)
    assert.strictEqual(state.availablePlayers.some(player => player.id === playerIds[2].toString()), true)
    assert.strictEqual(state.session.currentPickNumber, 2)

    await store.performAdminAction(slug, 'setNextTeam', {
      expectedVersion: state.session.version,
      teamId: teamIds[0].toString()
    })
    const captainState = await store.getDraftState(slug, {
      role: 'captain',
      draftSessionId: identity.draftSessionId,
      teamId: identity.teamId
    })
    assert.strictEqual(captainState.session.currentTeamId, teamIds[0].toString())
    assert.strictEqual(captainState.availablePlayers[0].comments, undefined)

    console.log('draft integration: all assertions passed')
  } finally {
    if (draftSessionId) {
      await Promise.all([
        db.collection('draft_captain_credentials').deleteMany({ draftSessionId }),
        db.collection('draft_picks').deleteMany({ draftSessionId }),
        db.collection('draft_events').deleteMany({ draftSessionId }),
        db.collection('draft_sessions').deleteMany({ _id: draftSessionId })
      ])
    }
    await db.collection('team_players_manies').deleteMany({ Team_left_id: { $in: teamIds } })
    await db.collection('team_captains_manies').deleteMany({ Team_left_id: { $in: teamIds } })
    await db.collection('player_leagues_manies').deleteMany({ League_right_id: leagueId })
    await db.collection('players').deleteMany({ _id: { $in: playerIds } })
    await db.collection('teams').deleteMany({ _id: { $in: teamIds } })
    await db.collection('leagues').deleteOne({ _id: leagueId })
    await client.close()
  }
}

run().then(() => process.exit(0)).catch(error => {
  console.error(error)
  process.exit(1)
})
