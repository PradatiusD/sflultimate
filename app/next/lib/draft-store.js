const mongodb = require('mongodb')
const { ObjectId } = mongodb
const { hashPassword, verifyPassword } = require('./draft-auth')
const { getDraftPosition, getUpcomingTeamIds, advanceDraftPosition } = require('./draft-engine')

const locks = new Map()
const waiters = new Map()
let dbPromise
let indexesPromise

class DraftError extends Error {
  constructor (message, statusCode = 400, code = 'DRAFT_ERROR') {
    super(message)
    this.name = 'DraftError'
    this.statusCode = statusCode
    this.code = code
  }
}

function isValidObjectIdString (value) {
  return typeof value === 'string' && /^[a-f\d]{24}$/i.test(value)
}

function toObjectId (value, label = 'ID') {
  if (value instanceof ObjectId) return value
  if (!isValidObjectIdString(value)) {
    throw new DraftError(`${label} is invalid`, 400, 'INVALID_ID')
  }
  return new ObjectId(value)
}

function idString (value) {
  return value ? value.toString() : null
}

async function withDraftLock (key, task) {
  const lockKey = String(key)
  const previous = locks.get(lockKey) || Promise.resolve()
  let release
  const current = new Promise(resolve => { release = resolve })
  locks.set(lockKey, current)
  await previous
  try {
    return await task()
  } finally {
    release()
    if (locks.get(lockKey) === current) locks.delete(lockKey)
  }
}

function notifyDraftChanged (draftSessionId) {
  const key = String(draftSessionId)
  const listeners = waiters.get(key)
  if (!listeners) return
  waiters.delete(key)
  listeners.forEach(resolve => resolve(true))
}

function waitForDraftChange (draftSessionId, timeoutMs = 20000) {
  const key = String(draftSessionId)
  return new Promise(resolve => {
    const listeners = waiters.get(key) || new Set()
    const finish = changed => {
      clearTimeout(timer)
      const active = waiters.get(key)
      if (active) {
        active.delete(onChange)
        if (active.size === 0) waiters.delete(key)
      }
      resolve(changed)
    }
    const onChange = () => finish(true)
    listeners.add(onChange)
    waiters.set(key, listeners)
    const timer = setTimeout(() => finish(false), timeoutMs)
  })
}

function projectPlayer (player, includeComments) {
  const projected = {
    id: idString(player._id),
    firstName: player.firstName,
    lastName: player.lastName,
    gender: player.gender,
    age: player.age,
    shirtSize: player.shirtSize,
    skillLevel: player.skillLevel,
    athleticismLevel: player.athleticismLevel,
    experienceLevel: player.experienceLevel,
    throwsLevel: player.throwsLevel,
    participation: player.participation,
    preferredPositions: player.preferredPositions,
    partnerName: player.partnerName,
    willAttendFinals: player.willAttendFinals
  }
  if (includeComments) projected.comments = player.comments
  return projected
}

function getMongoUri () {
  if (process.env.MONGOLAB_URI) {
    return process.env.MONGOLAB_URI.replace('/sflultimate', '/sflultimateV5')
  }
  const keystone = require('../../keystone')
  return keystone.adapter.config.mongoUri
}

async function getDb () {
  if (!dbPromise) {
    dbPromise = mongodb.connect(getMongoUri(), { useUnifiedTopology: true })
      .then(client => client.db('sflultimateV5'))
  }
  const db = await dbPromise
  if (!indexesPromise) indexesPromise = ensureIndexes(db)
  await indexesPromise
  return db
}

async function ensureIndexes (db) {
  await Promise.all([
    db.collection('draft_sessions').createIndex({ leagueId: 1 }, { unique: true }),
    db.collection('draft_captain_credentials').createIndex({ draftSessionId: 1, teamId: 1 }, { unique: true }),
    db.collection('draft_picks').createIndex({ draftSessionId: 1, playerId: 1 }, { unique: true }),
    db.collection('draft_picks').createIndex({ draftSessionId: 1, selectionNumber: 1 }, { unique: true }),
    db.collection('draft_events').createIndex({ draftSessionId: 1, createdAt: 1 })
  ])
}

async function findLeagueBySlug (db, leagueSlug) {
  if (typeof leagueSlug !== 'string' || !leagueSlug.trim()) {
    throw new DraftError('League slug is required', 400, 'INVALID_LEAGUE')
  }
  const league = await db.collection('leagues').findOne({ slug: leagueSlug.trim() })
  if (!league) throw new DraftError('Draft league was not found', 404, 'LEAGUE_NOT_FOUND')
  return league
}

async function getOrderedTeams (db, leagueId) {
  const teams = await db.collection('teams').find({ league: leagueId }).sort({ draftOrder: 1, name: 1 }).toArray()
  if (teams.length < 2) {
    throw new DraftError('At least two teams are required to start a draft', 409, 'DRAFT_SETUP_INVALID')
  }
  const orders = teams.map(team => team.draftOrder)
  if (orders.some(order => !Number.isInteger(order)) || new Set(orders).size !== teams.length) {
    throw new DraftError('Every team needs a unique draft order before initializing the draft', 409, 'DRAFT_SETUP_INVALID')
  }
  return teams
}

async function getDraftSessionForLeague (db, leagueId) {
  return db.collection('draft_sessions').findOne({ leagueId })
}

async function createDraftSession (db, league, teams) {
  const now = new Date()
  const session = {
    leagueId: league._id,
    status: 'setup',
    teamOrder: teams.map(team => team._id),
    currentPickNumber: 0,
    selectionCount: 0,
    nextTeamOverrideId: null,
    version: 1,
    showCommentsToCaptains: false,
    createdAt: now,
    updatedAt: now
  }
  try {
    const result = await db.collection('draft_sessions').insertOne(session)
    session._id = result.insertedId
    return session
  } catch (error) {
    if (error.code === 11000) return getDraftSessionForLeague(db, league._id)
    throw error
  }
}

async function getOrCreateDraft (leagueSlug) {
  const db = await getDb()
  const league = await findLeagueBySlug(db, leagueSlug)
  let session = await getDraftSessionForLeague(db, league._id)
  if (!session) {
    const teams = await getOrderedTeams(db, league._id)
    session = await createDraftSession(db, league, teams)
  }
  return { db, league, session }
}

async function getExistingDraft (leagueSlug) {
  const db = await getDb()
  const league = await findLeagueBySlug(db, leagueSlug)
  const session = await getDraftSessionForLeague(db, league._id)
  if (!session) throw new DraftError('The commissioner has not initialized this draft', 404, 'DRAFT_NOT_INITIALIZED')
  return { db, league, session }
}

async function loadDraftData (db, league, session) {
  const teamIds = session.teamOrder
  const teamDocs = await db.collection('teams').find({ _id: { $in: teamIds } }).toArray()
  const teamById = new Map(teamDocs.map(team => [idString(team._id), team]))
  const orderedTeams = teamIds.map(teamId => teamById.get(idString(teamId))).filter(Boolean)

  const [leagueRelations, rosterRelations, captainRelations, picks, credentials] = await Promise.all([
    db.collection('player_leagues_manies').find({ League_right_id: league._id }).toArray(),
    db.collection('team_players_manies').find({ Team_left_id: { $in: teamIds } }).sort({ _id: 1 }).toArray(),
    db.collection('team_captains_manies').find({ Team_left_id: { $in: teamIds } }).sort({ _id: 1 }).toArray(),
    db.collection('draft_picks').find({ draftSessionId: session._id }).sort({ selectionNumber: 1 }).toArray(),
    db.collection('draft_captain_credentials').find({ draftSessionId: session._id }).toArray()
  ])

  const playerIds = new Set(leagueRelations.map(relation => idString(relation.Player_left_id)))
  rosterRelations.forEach(relation => playerIds.add(idString(relation.Player_right_id)))
  captainRelations.forEach(relation => playerIds.add(idString(relation.Player_right_id)))
  const players = await db.collection('players').find({
    _id: { $in: Array.from(playerIds).filter(Boolean).map(id => new ObjectId(id)) }
  }).toArray()

  return {
    orderedTeams,
    playerById: new Map(players.map(player => [idString(player._id), player])),
    leaguePlayerIds: new Set(leagueRelations.map(relation => idString(relation.Player_left_id))),
    rosterRelations,
    captainRelations,
    picks,
    credentialTeamIds: new Set(credentials.map(credential => idString(credential.teamId)))
  }
}

function buildState (league, session, data, viewer) {
  const includeComments = viewer.role === 'admin' || session.showCommentsToCaptains
  const assignedPlayerIds = new Set()
  data.rosterRelations.forEach(relation => assignedPlayerIds.add(idString(relation.Player_right_id)))
  data.captainRelations.forEach(relation => assignedPlayerIds.add(idString(relation.Player_right_id)))

  const teamOrder = session.teamOrder.map(idString)
  const position = getDraftPosition(teamOrder, session.currentPickNumber, idString(session.nextTeamOverrideId))
  const upcomingTeamIds = getUpcomingTeamIds(teamOrder, session.currentPickNumber, idString(session.nextTeamOverrideId), Math.min(5, teamOrder.length + 1))

  const teams = data.orderedTeams.map(team => {
    const teamId = idString(team._id)
    const captainIds = data.captainRelations
      .filter(relation => idString(relation.Team_left_id) === teamId)
      .map(relation => idString(relation.Player_right_id))
    const rosterIds = data.rosterRelations
      .filter(relation => idString(relation.Team_left_id) === teamId)
      .map(relation => idString(relation.Player_right_id))
    const seen = new Set()
    const roster = [...captainIds, ...rosterIds]
      .filter(playerId => {
        if (seen.has(playerId)) return false
        seen.add(playerId)
        return true
      })
      .map(playerId => data.playerById.get(playerId))
      .filter(Boolean)
      .map(player => ({
        ...projectPlayer(player, includeComments),
        isCaptain: captainIds.includes(idString(player._id))
      }))

    return {
      id: teamId,
      name: team.name,
      slug: team.slug || teamId,
      color: team.color,
      draftOrder: team.draftOrder,
      roster,
      captainPasswordSet: viewer.role === 'admin' ? data.credentialTeamIds.has(teamId) : undefined
    }
  })

  const availablePlayers = Array.from(data.leaguePlayerIds)
    .filter(playerId => !assignedPlayerIds.has(playerId))
    .map(playerId => data.playerById.get(playerId))
    .filter(Boolean)
    .map(player => projectPlayer(player, includeComments))
    .sort((a, b) => {
      const scoreA = a.skillLevel || 0
      const scoreB = b.skillLevel || 0
      if (scoreA !== scoreB) return scoreB - scoreA
      return `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`)
    })

  const teamNameById = new Map(teams.map(team => [team.id, team.name]))
  const picks = data.picks.map(pick => ({
    id: idString(pick._id),
    selectionNumber: pick.selectionNumber,
    snakePosition: pick.snakePosition,
    roundNumber: pick.roundNumber,
    teamId: idString(pick.teamId),
    teamName: teamNameById.get(idString(pick.teamId)),
    scheduledTeamId: idString(pick.scheduledTeamId),
    player: projectPlayer(data.playerById.get(idString(pick.playerId)) || {}, includeComments),
    selectedByRole: pick.selectedByRole,
    advancedSequence: pick.advancedSequence,
    isCommissionerOverride: pick.isCommissionerOverride,
    overrideNote: pick.overrideNote,
    selectedAt: pick.selectedAt ? pick.selectedAt.toISOString() : null
  }))

  return {
    league: {
      id: idString(league._id),
      slug: league.slug,
      title: league.title
    },
    session: {
      id: idString(session._id),
      status: session.status,
      version: session.version,
      currentPickNumber: session.currentPickNumber,
      selectionCount: session.selectionCount,
      roundNumber: position.roundNumber,
      direction: position.direction,
      suggestedTeamId: position.suggestedTeamId,
      currentTeamId: position.currentTeamId,
      isTeamOverride: position.isOverride,
      nextTeamOverrideId: idString(session.nextTeamOverrideId),
      upcomingTeamIds,
      showCommentsToCaptains: viewer.role === 'admin' ? session.showCommentsToCaptains : undefined
    },
    viewer: {
      role: viewer.role,
      teamId: viewer.role === 'captain' ? viewer.teamId : null
    },
    teams,
    availablePlayers,
    picks
  }
}

async function getDraftState (leagueSlug, viewer, options = {}) {
  const draft = options.createIfMissing
    ? await getOrCreateDraft(leagueSlug)
    : await getExistingDraft(leagueSlug)
  if (viewer.role === 'captain') {
    if (idString(draft.session._id) !== viewer.draftSessionId || !draft.session.teamOrder.map(idString).includes(viewer.teamId)) {
      throw new DraftError('Captain session is not authorized for this draft', 401, 'NOT_AUTHORIZED')
    }
  }
  const data = await loadDraftData(draft.db, draft.league, draft.session)
  return buildState(draft.league, draft.session, data, viewer)
}

async function setCaptainPassword (leagueSlug, teamId, password) {
  const { db, session } = await getOrCreateDraft(leagueSlug)
  const teamObjectId = toObjectId(teamId, 'Team ID')
  if (!session.teamOrder.map(idString).includes(idString(teamObjectId))) {
    throw new DraftError('Team is not part of this draft', 404, 'TEAM_NOT_FOUND')
  }
  const passwordData = await hashPassword(password)
  await db.collection('draft_captain_credentials').updateOne({
    draftSessionId: session._id,
    teamId: teamObjectId
  }, {
    $set: {
      ...passwordData,
      failedAttempts: 0,
      lockedUntil: null,
      updatedAt: new Date()
    },
    $setOnInsert: { createdAt: new Date() }
  }, { upsert: true })
  return { draftSessionId: idString(session._id), teamId: idString(teamObjectId) }
}

async function authenticateCaptain (leagueSlug, teamSlug, password) {
  const { db, session } = await getExistingDraft(leagueSlug)
  const teamCriteria = isValidObjectIdString(teamSlug)
    ? { $or: [{ slug: teamSlug }, { _id: new ObjectId(teamSlug) }] }
    : { slug: teamSlug }
  const team = await db.collection('teams').findOne({
    _id: { $in: session.teamOrder },
    ...teamCriteria
  })
  if (!team) throw new DraftError('Team or password is incorrect', 401, 'LOGIN_FAILED')

  const credential = await db.collection('draft_captain_credentials').findOne({
    draftSessionId: session._id,
    teamId: team._id
  })
  const now = new Date()
  if (!credential || (credential.lockedUntil && credential.lockedUntil > now)) {
    throw new DraftError('Team or password is incorrect', 401, 'LOGIN_FAILED')
  }

  const valid = await verifyPassword(password, credential)
  if (!valid) {
    const failedAttempts = (credential.failedAttempts || 0) + 1
    await db.collection('draft_captain_credentials').updateOne({ _id: credential._id }, {
      $set: {
        failedAttempts,
        lockedUntil: failedAttempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null,
        updatedAt: now
      }
    })
    throw new DraftError('Team or password is incorrect', 401, 'LOGIN_FAILED')
  }

  await db.collection('draft_captain_credentials').updateOne({ _id: credential._id }, {
    $set: { failedAttempts: 0, lockedUntil: null, lastLoginAt: now, updatedAt: now }
  })
  return {
    draftSessionId: idString(session._id),
    teamId: idString(team._id),
    teamSlug: team.slug
  }
}

async function getCaptainPageInfo (leagueSlug, teamSlug) {
  const { db, league, session } = await getExistingDraft(leagueSlug)
  const teamCriteria = isValidObjectIdString(teamSlug)
    ? { $or: [{ slug: teamSlug }, { _id: new ObjectId(teamSlug) }] }
    : { slug: teamSlug }
  const team = await db.collection('teams').findOne({
    _id: { $in: session.teamOrder },
    ...teamCriteria
  })
  if (!team) throw new DraftError('Draft team was not found', 404, 'TEAM_NOT_FOUND')
  return {
    league: { id: idString(league._id), slug: league.slug, title: league.title },
    team: { id: idString(team._id), slug: team.slug || idString(team._id), name: team.name, color: team.color }
  }
}

async function updateSession (db, session, updates, eventType, eventData = {}) {
  const now = new Date()
  const result = await db.collection('draft_sessions').findOneAndUpdate({
    _id: session._id,
    version: session.version
  }, {
    $set: { ...updates, updatedAt: now },
    $inc: { version: 1 }
  }, { returnDocument: 'after' })
  if (!result.value) throw new DraftError('Draft changed before the action completed', 409, 'STALE_DRAFT')
  await db.collection('draft_events').insertOne({
    draftSessionId: session._id,
    type: eventType,
    ...eventData,
    createdAt: now
  })
  notifyDraftChanged(session._id)
  return result.value
}

async function performAdminAction (leagueSlug, action, payload = {}) {
  const { db, session } = await getOrCreateDraft(leagueSlug)
  return withDraftLock(session._id, async () => {
    const current = await db.collection('draft_sessions').findOne({ _id: session._id })
    if (payload.expectedVersion !== undefined && payload.expectedVersion !== current.version) {
      throw new DraftError('Draft changed before the action completed', 409, 'STALE_DRAFT')
    }

    if (action === 'start' || action === 'resume') {
      const teams = await getOrderedTeams(db, current.leagueId)
      const missingCredentials = await Promise.all(current.teamOrder.map(teamId => db.collection('draft_captain_credentials').findOne({ draftSessionId: current._id, teamId })))
      if (missingCredentials.some(credential => !credential)) {
        throw new DraftError('Set a captain password for every team before starting', 409, 'PASSWORDS_REQUIRED')
      }
      const updates = { status: 'active' }
      if (action === 'start' && !current.startedAt) updates.startedAt = new Date()
      await updateSession(db, current, updates, action, { teamCount: teams.length })
    } else if (action === 'pause') {
      await updateSession(db, current, { status: 'paused' }, action)
    } else if (action === 'complete') {
      await updateSession(db, current, { status: 'completed', completedAt: new Date() }, action)
    } else if (action === 'setNextTeam') {
      const teamId = payload.teamId ? toObjectId(payload.teamId, 'Team ID') : null
      if (teamId && !current.teamOrder.map(idString).includes(idString(teamId))) {
        throw new DraftError('Team is not part of this draft', 404, 'TEAM_NOT_FOUND')
      }
      await updateSession(db, current, { nextTeamOverrideId: teamId }, action, { teamId })
    } else if (action === 'settings') {
      await updateSession(db, current, { showCommentsToCaptains: Boolean(payload.showCommentsToCaptains) }, action)
    } else {
      throw new DraftError('Admin action is invalid', 400, 'INVALID_ACTION')
    }
  })
}

async function isPlayerEligible (db, leagueId, teamOrder, playerId) {
  const leagueRelation = await db.collection('player_leagues_manies').findOne({
    League_right_id: leagueId,
    Player_left_id: playerId
  })
  if (!leagueRelation) return false
  const [rosterRelation, captainRelation] = await Promise.all([
    db.collection('team_players_manies').findOne({ Team_left_id: { $in: teamOrder }, Player_right_id: playerId }),
    db.collection('team_captains_manies').findOne({ Team_left_id: { $in: teamOrder }, Player_right_id: playerId })
  ])
  return !rosterRelation && !captainRelation
}

async function pickPlayer (leagueSlug, payload, actor) {
  const { db, session } = await getExistingDraft(leagueSlug)
  return withDraftLock(session._id, async () => {
    const current = await db.collection('draft_sessions').findOne({ _id: session._id })
    if (current.status !== 'active') throw new DraftError('The draft is not active', 409, 'DRAFT_NOT_ACTIVE')
    if (payload.expectedVersion !== current.version) throw new DraftError('Draft changed before the pick completed', 409, 'STALE_DRAFT')

    const teamOrder = current.teamOrder.map(idString)
    const position = getDraftPosition(teamOrder, current.currentPickNumber, idString(current.nextTeamOverrideId))
    const requestedTeamId = actor.role === 'captain' ? actor.teamId : payload.teamId || position.currentTeamId
    if (actor.role === 'captain' && actor.teamId !== position.currentTeamId) {
      throw new DraftError('It is not your team’s turn', 403, 'OUT_OF_TURN')
    }
    if (!teamOrder.includes(requestedTeamId)) throw new DraftError('Team is not part of this draft', 404, 'TEAM_NOT_FOUND')

    const playerId = toObjectId(payload.playerId, 'Player ID')
    const teamId = toObjectId(requestedTeamId, 'Team ID')
    if (!await isPlayerEligible(db, current.leagueId, current.teamOrder, playerId)) {
      throw new DraftError('Player is no longer available', 409, 'PLAYER_UNAVAILABLE')
    }

    const shouldAdvance = actor.role === 'captain' ? true : payload.advanceOrder !== false
    const nextPosition = advanceDraftPosition(current, shouldAdvance)
    const now = new Date()
    const pick = {
      draftSessionId: current._id,
      leagueId: current.leagueId,
      selectionNumber: current.selectionCount + 1,
      snakePosition: current.currentPickNumber,
      roundNumber: position.roundNumber,
      scheduledTeamId: toObjectId(position.currentTeamId),
      teamId,
      playerId,
      selectedByRole: actor.role,
      advancedSequence: shouldAdvance,
      isCommissionerOverride: actor.role === 'admin' && (requestedTeamId !== position.currentTeamId || !shouldAdvance),
      overrideNote: actor.role === 'admin' && typeof payload.overrideNote === 'string' ? payload.overrideNote.trim().slice(0, 240) : '',
      priorNextTeamOverrideId: current.nextTeamOverrideId || null,
      selectedAt: now
    }

    let insertedPickId
    let insertedAssociationId
    try {
      const pickResult = await db.collection('draft_picks').insertOne(pick)
      insertedPickId = pickResult.insertedId
      const associationResult = await db.collection('team_players_manies').insertOne({
        Team_left_id: teamId,
        Player_right_id: playerId
      })
      insertedAssociationId = associationResult.insertedId
      const updateResult = await db.collection('draft_sessions').findOneAndUpdate({
        _id: current._id,
        version: current.version
      }, {
        $set: {
          currentPickNumber: nextPosition.currentPickNumber,
          nextTeamOverrideId: nextPosition.nextTeamOverrideId ? toObjectId(nextPosition.nextTeamOverrideId) : null,
          updatedAt: now
        },
        $inc: { selectionCount: 1, version: 1 }
      }, { returnDocument: 'after' })
      if (!updateResult.value) throw new DraftError('Draft changed before the pick completed', 409, 'STALE_DRAFT')
      await db.collection('draft_events').insertOne({
        draftSessionId: current._id,
        type: 'pick',
        pickId: insertedPickId,
        teamId,
        playerId,
        createdAt: now
      })
    } catch (error) {
      if (insertedAssociationId) await db.collection('team_players_manies').deleteOne({ _id: insertedAssociationId })
      if (insertedPickId) await db.collection('draft_picks').deleteOne({ _id: insertedPickId })
      if (error.code === 11000) throw new DraftError('Player is no longer available', 409, 'PLAYER_UNAVAILABLE')
      throw error
    }

    notifyDraftChanged(current._id)
    return getDraftState(leagueSlug, actor.role === 'admin'
      ? { role: 'admin' }
      : { role: 'captain', teamId: actor.teamId, draftSessionId: idString(current._id) })
  })
}

async function undoLastPick (leagueSlug, expectedVersion) {
  const { db, session } = await getExistingDraft(leagueSlug)
  return withDraftLock(session._id, async () => {
    const current = await db.collection('draft_sessions').findOne({ _id: session._id })
    if (expectedVersion !== current.version) throw new DraftError('Draft changed before undo completed', 409, 'STALE_DRAFT')
    const pick = await db.collection('draft_picks').find({ draftSessionId: current._id }).sort({ selectionNumber: -1 }).limit(1).next()
    if (!pick) throw new DraftError('There is no pick to undo', 409, 'NOTHING_TO_UNDO')

    await db.collection('team_players_manies').deleteOne({
      Team_left_id: pick.teamId,
      Player_right_id: pick.playerId
    })
    await db.collection('draft_picks').deleteOne({ _id: pick._id })
    const updated = await db.collection('draft_sessions').findOneAndUpdate({ _id: current._id, version: current.version }, {
      $set: {
        currentPickNumber: pick.snakePosition,
        nextTeamOverrideId: pick.priorNextTeamOverrideId || null,
        updatedAt: new Date()
      },
      $inc: { version: 1 }
    }, { returnDocument: 'after' })
    if (!updated.value) throw new DraftError('Draft changed before undo completed', 409, 'STALE_DRAFT')
    await db.collection('draft_events').insertOne({
      draftSessionId: current._id,
      type: 'undo',
      selectionNumber: pick.selectionNumber,
      teamId: pick.teamId,
      playerId: pick.playerId,
      createdAt: new Date()
    })
    notifyDraftChanged(current._id)
    return getDraftState(leagueSlug, { role: 'admin' })
  })
}

module.exports = {
  DraftError,
  isValidObjectIdString,
  withDraftLock,
  waitForDraftChange,
  notifyDraftChanged,
  projectPlayer,
  getDraftState,
  getOrCreateDraft,
  getExistingDraft,
  setCaptainPassword,
  authenticateCaptain,
  getCaptainPageInfo,
  performAdminAction,
  pickPlayer,
  undoLastPick
}
