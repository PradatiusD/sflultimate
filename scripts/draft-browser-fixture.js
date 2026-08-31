const mongodb = require('mongodb')
const { ObjectId } = mongodb
require('dotenv').config({ path: '.env' })

const LEAGUE_SLUG = 'draft-browser-test'
const TEAM_SLUGS = ['draft-browser-team-a', 'draft-browser-team-b']
const PASSWORD = 'draft-browser-password'

if (!process.env.MONGOLAB_URI || !/(localhost|127\.0\.0\.1)/.test(process.env.MONGOLAB_URI)) {
  console.error('draft browser fixture refused: MONGOLAB_URI must point to localhost')
  process.exit(1)
}
process.env.DRAFT_SESSION_SECRET = process.env.DRAFT_SESSION_SECRET || 'draft-browser-test-secret'

async function connect () {
  const client = await mongodb.connect(process.env.MONGOLAB_URI.replace('/sflultimate', '/sflultimateV5'), { useUnifiedTopology: true })
  return { client, db: client.db('sflultimateV5') }
}

async function cleanup (db) {
  const league = await db.collection('leagues').findOne({ slug: LEAGUE_SLUG })
  if (!league) return
  const teams = await db.collection('teams').find({ league: league._id }).toArray()
  const teamIds = teams.map(team => team._id)
  const playerRelations = await db.collection('player_leagues_manies').find({ League_right_id: league._id }).toArray()
  const playerIds = playerRelations.map(relation => relation.Player_left_id)
  const session = await db.collection('draft_sessions').findOne({ leagueId: league._id })
  if (session) {
    await Promise.all([
      db.collection('draft_captain_credentials').deleteMany({ draftSessionId: session._id }),
      db.collection('draft_picks').deleteMany({ draftSessionId: session._id }),
      db.collection('draft_events').deleteMany({ draftSessionId: session._id }),
      db.collection('draft_sessions').deleteOne({ _id: session._id })
    ])
  }
  await db.collection('team_players_manies').deleteMany({ Team_left_id: { $in: teamIds } })
  await db.collection('team_captains_manies').deleteMany({ Team_left_id: { $in: teamIds } })
  await db.collection('player_leagues_manies').deleteMany({ League_right_id: league._id })
  await db.collection('players').deleteMany({ _id: { $in: playerIds } })
  await db.collection('teams').deleteMany({ _id: { $in: teamIds } })
  await db.collection('leagues').deleteOne({ _id: league._id })
}

async function seed (db) {
  await cleanup(db)
  const leagueId = new ObjectId()
  const teamIds = [new ObjectId(), new ObjectId()]
  const playerIds = [new ObjectId(), new ObjectId(), new ObjectId()]
  await db.collection('leagues').insertOne({ _id: leagueId, name: LEAGUE_SLUG, title: 'Browser Draft Test', slug: LEAGUE_SLUG })
  await db.collection('teams').insertMany(teamIds.map((teamId, index) => ({
    _id: teamId,
    name: index === 0 ? 'Test Flamingos' : 'Test Waves',
    slug: TEAM_SLUGS[index],
    league: leagueId,
    draftOrder: index + 1,
    color: index === 0 ? '#e44989' : '#1488a5'
  })))
  await db.collection('players').insertMany(playerIds.map((playerId, index) => ({
    _id: playerId,
    firstName: ['Jordan', 'Avery', 'Micah'][index],
    lastName: ['Reyes', 'Chen', 'Thompson'][index],
    name: `Browser Player ${index + 1}`,
    gender: index === 2 ? 'Male' : 'Female',
    age: 25 + index,
    skillLevel: 8 - index,
    participation: 80,
    preferredPositions: index === 0 ? 'Handler, Hybrid' : 'Cutter',
    comments: `Private browser note ${index + 1}`,
    email: `private-${index + 1}@example.com`,
    phoneNumber: '555-555-0000'
  })))
  await db.collection('player_leagues_manies').insertMany(playerIds.map(playerId => ({ Player_left_id: playerId, League_right_id: leagueId })))

  const store = require('../app/next/lib/draft-store')
  let state = await store.getDraftState(LEAGUE_SLUG, { role: 'admin' }, { createIfMissing: true })
  for (const teamId of teamIds) await store.setCaptainPassword(LEAGUE_SLUG, teamId.toString(), PASSWORD)
  state = await store.getDraftState(LEAGUE_SLUG, { role: 'admin' })
  await store.performAdminAction(LEAGUE_SLUG, 'start', { expectedVersion: state.session.version })
  console.log(`seeded ${LEAGUE_SLUG}`)
}

async function run () {
  const { client, db } = await connect()
  try {
    if (process.argv[2] === 'cleanup') await cleanup(db)
    else if (process.argv[2] === 'seed') await seed(db)
    else throw new Error('Use seed or cleanup')
  } finally {
    await client.close()
  }
}

run().then(() => process.exit(0)).catch(error => {
  console.error(error)
  process.exit(1)
})
