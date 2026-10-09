const crypto = require('crypto')
const graphql = require('./server-graphql-client')
const { hashPassword, verifyPassword } = require('./draft-auth')
const { getDraftPosition, getUpcomingTeamIds, advanceDraftPosition } = require('./draft-engine')

const locks = new Map()
const waiters = new Map()

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
  if (!isValidObjectIdString(value)) {
    throw new DraftError(`${label} is invalid`, 400, 'INVALID_ID')
  }
  return value
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

// Use the initialized Keystone instance and its normal list CRUD (hooks,
// validation and relationship handling), under the same sudo context as the
// existing server GraphQL client. Callers are authorized by draft-api.
function keystone () {
  if (!global.sflKeystone) throw new Error('The Keystone instance is not available in this server process')
  return global.sflKeystone
}

function list (name) {
  return keystone().lists[name]
}

function context () {
  return keystone().createContext().sudo()
}

async function find (name, where, orderBy) {
  const items = await list(name).listQuery({ where, ...(orderBy ? { orderBy } : {}) }, context())
  return items.map(item => ({ ...item, _id: item.id }))
}

async function one (name, where) {
  return (await find(name, where))[0] || null
}

function relationshipData (name, data) {
  const result = { ...data }
  for (const [key, value] of Object.entries(result)) {
    if (list(name).fieldsByPath[key]?.isRelationship && (value === null || typeof value === 'string' || value?._bsontype === 'ObjectID')) {
      result[key] = value === null ? { disconnectAll: true } : { connect: { id: String(value) } }
    }
  }
  return result
}

async function create (name, data) {
  const item = await list(name).createMutation(relationshipData(name, data), context())
  return { ...item, _id: item.id }
}

async function update (name, id, data) {
  return list(name).updateMutation(String(id), relationshipData(name, data), context())
}

async function remove (name, id) {
  return list(name).deleteMutation(String(id), context())
}

async function normalizeSession (session) {
  if (!session) return session
  if (session.orderJson) session.teamOrder = JSON.parse(session.orderJson)
  else {
    // Compatibility read only: Keystone's field projection omits the old array.
    // Keep historical order and IDs without any migration writes.
    const legacy = await list('DraftSession').adapter.model.findById(session._id).select('teamOrder').lean()
    session.teamOrder = (legacy?.teamOrder || []).map(String)
  }
  return session
}

async function sessionById (id) {
  return normalizeSession(await one('DraftSession', { id: String(id) }))
}

// A non-expiring database claim, not a process-only mutex. No automatic lease
// expiry: a crashed worker must not overlap a replacement worker's mutations.
// These two compare-and-set operations are the only direct model writes.
async function withSessionLock (sessionId, task) {
  return withDraftLock(sessionId, async () => {
    const token = crypto.randomBytes(16).toString('hex')
    const model = list('DraftSession').adapter.model
    const claimed = await model.findOneAndUpdate({ _id: sessionId, operationToken: null }, { $set: { operationToken: token } }, { new: true }).lean()
    if (!claimed) throw new DraftError('Draft is processing another action; reload and retry', 409, 'DRAFT_BUSY')
    let release = true
    try {
      return await task(await sessionById(sessionId))
    } catch (error) {
      if (error.keepDraftLocked) release = false
      throw error
    } finally {
      if (release) await model.updateOne({ _id: sessionId, operationToken: token }, { $unset: { operationToken: 1 } })
    }
  })
}

async function findLeagueBySlug (leagueSlug) {
  if (typeof leagueSlug !== 'string' || !leagueSlug.trim()) throw new DraftError('League slug is required', 400, 'INVALID_LEAGUE')
  const league = await one('League', { slug: leagueSlug.trim() })
  if (!league) throw new DraftError('Draft league was not found', 404, 'LEAGUE_NOT_FOUND')
  return league
}

async function getOrderedTeams (leagueId) {
  const teams = await find('Team', { league: { id: String(leagueId) } }, 'draftOrder_ASC')
  if (teams.length < 2) throw new DraftError('At least two teams are required to start a draft', 409, 'DRAFT_SETUP_INVALID')
  const orders = teams.map(team => team.draftOrder)
  if (orders.some(order => !Number.isInteger(order)) || new Set(orders).size !== teams.length) {
    throw new DraftError('Every team needs a unique draft order before initializing the draft', 409, 'DRAFT_SETUP_INVALID')
  }
  return teams
}

async function getOrCreateDraft (leagueSlug) {
  const league = await findLeagueBySlug(leagueSlug)
  const where = { leagueId: { id: String(league._id) } }
  let session = await one('DraftSession', where)
  if (!session) {
    const teams = await getOrderedTeams(league._id)
    try {
      session = await create('DraftSession', {
        leagueId: league._id,
        status: 'setup',
        orderJson: JSON.stringify(teams.map(team => String(team._id))),
        currentPickNumber: 0,
        selectionCount: 0,
        version: 1,
        showCommentsToCaptains: false,
        createdAt: new Date(),
        updatedAt: new Date()
      })
    } catch (error) {
      // The unique league index resolves simultaneous initialization.
      session = await one('DraftSession', where)
      if (!session) throw error
    }
  }
  return { league, session: await normalizeSession(session) }
}

async function getExistingDraft (leagueSlug) {
  const league = await findLeagueBySlug(leagueSlug)
  const session = await one('DraftSession', { leagueId: { id: String(league._id) } })
  if (!session) throw new DraftError('The commissioner has not initialized this draft', 404, 'DRAFT_NOT_INITIALIZED')
  return { league, session: await normalizeSession(session) }
}

const playerFields = 'id firstName lastName gender age shirtSize skillLevel athleticismLevel experienceLevel throwsLevel participation preferredPositions partnerName willAttendFinals comments'

async function loadDraftData (league, session) {
  const { data } = await graphql.query({
    query: `query DraftPlayers($teamIds: [ID!], $leagueId: ID!) {
      allTeams(where: { id_in: $teamIds }) { id name slug color draftOrder players { ${playerFields} } captains { ${playerFields} } }
      allPlayers(where: { leagues_some: { id: $leagueId } }) { ${playerFields} }
    }`,
    variables: { teamIds: session.teamOrder.map(String), leagueId: String(league._id) }
  })
  const teamById = new Map(data.allTeams.map(team => [team.id, { ...team, _id: team.id }]))
  const orderedTeams = session.teamOrder.map(id => teamById.get(String(id))).filter(Boolean)
  const players = [...data.allPlayers, ...orderedTeams.flatMap(team => [...team.players, ...team.captains])]
  const where = { draftSessionId: { id: String(session._id) } }
  const [picks, credentials] = await Promise.all([
    find('DraftPick', where, 'selectionNumber_ASC'),
    find('DraftCaptainCredential', where)
  ])
  // This is an in-memory view of Keystone relationship results, not join-table IO.
  const relations = field => orderedTeams.flatMap(team => team[field].map(player => ({ teamId: team.id, playerId: player.id })))
  return {
    orderedTeams,
    playerById: new Map(players.map(player => [player.id, { ...player, _id: player.id }])),
    leaguePlayerIds: new Set(data.allPlayers.map(player => player.id)),
    rosterRelations: relations('players'),
    captainRelations: relations('captains'),
    picks,
    credentialTeamIds: new Set(credentials.map(credential => String(credential.teamId)))
  }
}

function buildState (league, session, data, viewer) {
  const includeComments = viewer.role === 'admin' || session.showCommentsToCaptains
  const assignedPlayerIds = new Set()
  data.rosterRelations.forEach(relation => assignedPlayerIds.add(idString(relation.playerId)))
  data.captainRelations.forEach(relation => assignedPlayerIds.add(idString(relation.playerId)))

  const teamOrder = session.teamOrder.map(idString)
  const position = getDraftPosition(teamOrder, session.currentPickNumber, idString(session.nextTeamOverrideId))
  const upcomingTeamIds = getUpcomingTeamIds(teamOrder, session.currentPickNumber, idString(session.nextTeamOverrideId), Math.min(5, teamOrder.length + 1))

  const teams = data.orderedTeams.map(team => {
    const teamId = idString(team._id)
    const captainIds = data.captainRelations
      .filter(relation => idString(relation.teamId) === teamId)
      .map(relation => idString(relation.playerId))
    const rosterIds = data.rosterRelations
      .filter(relation => idString(relation.teamId) === teamId)
      .map(relation => idString(relation.playerId))
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

function authorizeViewer (session, viewer) {
  if (viewer?.role === 'admin') return
  if (viewer?.role !== 'captain' || viewer.draftSessionId !== String(session._id) || !session.teamOrder.map(String).includes(viewer.teamId)) {
    throw new DraftError('Captain session is not authorized for this draft', 401, 'NOT_AUTHORIZED')
  }
}

async function getDraftState (leagueSlug, viewer, options = {}) {
  if (options.createIfMissing && viewer?.role !== 'admin') throw new DraftError('Not authorized', 403, 'NOT_AUTHORIZED')
  const draft = options.createIfMissing ? await getOrCreateDraft(leagueSlug) : await getExistingDraft(leagueSlug)
  authorizeViewer(draft.session, viewer)
  if (draft.session.operationToken) throw new DraftError('Draft is processing another action; reload and retry', 409, 'DRAFT_BUSY')
  const data = await loadDraftData(draft.league, draft.session)
  const latest = await sessionById(draft.session._id)
  if (latest.operationToken || latest.version !== draft.session.version) throw new DraftError('Draft changed while loading; reload and retry', 409, 'STALE_DRAFT')
  return buildState(draft.league, draft.session, data, viewer)
}

async function setCaptainPassword (leagueSlug, teamId, password) {
  const { session } = await getOrCreateDraft(leagueSlug)
  toObjectId(teamId, 'Team ID')
  if (!session.teamOrder.map(String).includes(teamId)) throw new DraftError('Team is not part of this draft', 404, 'TEAM_NOT_FOUND')
  const passwordData = await hashPassword(password)
  await withSessionLock(session._id, async () => {
    const existing = await one('DraftCaptainCredential', { draftSessionId: { id: String(session._id) }, teamId: { id: teamId } })
    const now = new Date()
    const data = { ...passwordData, failedAttempts: 0, lockedUntil: null, updatedAt: now }
    if (existing) await update('DraftCaptainCredential', existing._id, data)
    else await create('DraftCaptainCredential', { ...data, draftSessionId: session._id, teamId, createdAt: now })
  })
  return { draftSessionId: String(session._id), teamId }
}

async function findDraftTeam (session, teamSlug) {
  // Always scope BOTH slug and ID branches to this draft (slugs are not global).
  if (typeof teamSlug !== 'string') return null
  return one('Team', {
    id_in: session.teamOrder.map(String),
    OR: [{ slug: teamSlug }, ...(isValidObjectIdString(teamSlug) ? [{ id: teamSlug }] : [])]
  })
}

async function authenticateCaptain (leagueSlug, teamSlug, password) {
  const { session } = await getExistingDraft(leagueSlug)
  const team = await findDraftTeam(session, teamSlug)
  if (!team) throw new DraftError('Team or password is incorrect', 401, 'LOGIN_FAILED')
  return withSessionLock(session._id, async () => {
    const credential = await one('DraftCaptainCredential', { draftSessionId: { id: String(session._id) }, teamId: { id: String(team._id) } })
    const now = new Date()
    if (!credential || (credential.lockedUntil && credential.lockedUntil > now)) throw new DraftError('Team or password is incorrect', 401, 'LOGIN_FAILED')
    if (!await verifyPassword(password, credential)) {
      const failedAttempts = (credential.failedAttempts || 0) + 1
      await update('DraftCaptainCredential', credential._id, {
        failedAttempts,
        lockedUntil: failedAttempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null,
        updatedAt: now
      })
      throw new DraftError('Team or password is incorrect', 401, 'LOGIN_FAILED')
    }
    await update('DraftCaptainCredential', credential._id, { failedAttempts: 0, lockedUntil: null, lastLoginAt: now, updatedAt: now })
    return {
      draftSessionId: String(session._id),
      teamId: String(team._id),
      teamSlug: team.slug
    }
  })
}

async function getCaptainPageInfo (leagueSlug, teamSlug) {
  const { league, session } = await getExistingDraft(leagueSlug)
  const team = await findDraftTeam(session, teamSlug)
  if (!team) throw new DraftError('Draft team was not found', 404, 'TEAM_NOT_FOUND')
  return {
    league: { id: String(league._id), slug: league.slug, title: league.title },
    team: { id: String(team._id), slug: team.slug || String(team._id), name: team.name, color: team.color }
  }
}

function checkVersion (session, expectedVersion) {
  if (expectedVersion !== session.version) throw new DraftError('Draft changed before the action completed', 409, 'STALE_DRAFT')
}

async function updateSession (session, updates, eventType, eventData = {}) {
  try {
    await create('DraftEvent', { draftSessionId: session._id, type: eventType, ...eventData, createdAt: new Date() })
    await update('DraftSession', session._id, { ...updates, version: session.version + 1, updatedAt: new Date() })
  } catch (error) {
    // A failed acknowledgement can mean the write committed. Do not attempt
    // destructive compensation or release the lock in that uncertain state.
    error.keepDraftLocked = true
    throw error
  }
}

async function performAdminAction (leagueSlug, action, payload = {}) {
  const { session } = await getOrCreateDraft(leagueSlug)
  await withSessionLock(session._id, async current => {
    if (payload.expectedVersion !== undefined) checkVersion(current, payload.expectedVersion)
    let updates
    let eventData = {}
    if (action === 'start' || action === 'resume') {
      const teams = await getOrderedTeams(current.leagueId)
      const credentials = await find('DraftCaptainCredential', { draftSessionId: { id: String(current._id) } })
      if (current.teamOrder.some(id => !credentials.some(credential => String(credential.teamId) === String(id)))) {
        throw new DraftError('Set a captain password for every team before starting', 409, 'PASSWORDS_REQUIRED')
      }
      updates = { status: 'active' }
      if (action === 'start' && !current.startedAt) updates.startedAt = new Date()
      eventData = { teamCount: teams.length }
    } else if (action === 'pause') updates = { status: 'paused' }
    else if (action === 'complete') updates = { status: 'completed', completedAt: new Date() }
    else if (action === 'setNextTeam') {
      const teamId = payload.teamId ? toObjectId(payload.teamId, 'Team ID') : null
      if (teamId && !current.teamOrder.map(String).includes(teamId)) throw new DraftError('Team is not part of this draft', 404, 'TEAM_NOT_FOUND')
      updates = { nextTeamOverrideId: teamId }
      eventData = { teamId }
    } else if (action === 'settings') updates = { showCommentsToCaptains: Boolean(payload.showCommentsToCaptains) }
    else throw new DraftError('Admin action is invalid', 400, 'INVALID_ACTION')
    await updateSession(current, updates, action, eventData)
  })
  notifyDraftChanged(session._id)
}

async function pickPlayer (leagueSlug, payload, actor) {
  const { league, session } = await getExistingDraft(leagueSlug)
  authorizeViewer(session, actor)
  const state = await withSessionLock(session._id, async current => {
    if (current.status !== 'active') throw new DraftError('The draft is not active', 409, 'DRAFT_NOT_ACTIVE')
    checkVersion(current, payload.expectedVersion)
    const teamOrder = current.teamOrder.map(String)
    const position = getDraftPosition(teamOrder, current.currentPickNumber, idString(current.nextTeamOverrideId))
    const teamId = actor.role === 'captain' ? actor.teamId : payload.teamId || position.currentTeamId
    if (actor.role === 'captain' && actor.teamId !== position.currentTeamId) throw new DraftError('It is not your team’s turn', 403, 'OUT_OF_TURN')
    if (!teamOrder.includes(teamId)) throw new DraftError('Team is not part of this draft', 404, 'TEAM_NOT_FOUND')
    const playerId = toObjectId(payload.playerId, 'Player ID')
    const data = await loadDraftData(league, current)
    if (!data.leaguePlayerIds.has(playerId) || [...data.rosterRelations, ...data.captainRelations].some(relation => relation.playerId === playerId) || data.picks.some(pick => String(pick.playerId) === playerId)) {
      throw new DraftError('Player is no longer available', 409, 'PLAYER_UNAVAILABLE')
    }
    const shouldAdvance = actor.role === 'captain' ? true : payload.advanceOrder !== false
    const nextPosition = advanceDraftPosition(current, shouldAdvance)
    // If any write fails (including an ambiguous network acknowledgement), keep
    // the claim for explicit reconciliation. Never delete a possibly committed pick.
    try {
      const pick = await create('DraftPick', {
        draftSessionId: current._id,
        leagueId: current.leagueId,
        selectionNumber: current.selectionCount + 1,
        snakePosition: current.currentPickNumber,
        roundNumber: position.roundNumber,
        scheduledTeamId: position.currentTeamId,
        teamId,
        playerId,
        selectedByRole: actor.role,
        advancedSequence: shouldAdvance,
        isCommissionerOverride: actor.role === 'admin' && (teamId !== position.currentTeamId || !shouldAdvance),
        overrideNote: actor.role === 'admin' && typeof payload.overrideNote === 'string' ? payload.overrideNote.trim().slice(0, 240) : '',
        priorNextTeamOverrideId: current.nextTeamOverrideId || null,
        selectedAt: new Date()
      })
      await update('Team', teamId, { players: { connect: [{ id: playerId }] } })
      await updateSession(current, {
        currentPickNumber: nextPosition.currentPickNumber,
        nextTeamOverrideId: nextPosition.nextTeamOverrideId || null,
        selectionCount: current.selectionCount + 1
      }, 'pick', { pickId: pick._id, teamId, playerId, selectionNumber: pick.selectionNumber })
    } catch (error) {
      error.keepDraftLocked = true
      throw error
    }
    const updated = await sessionById(session._id)
    return buildState(league, updated, await loadDraftData(league, updated), actor)
  })
  notifyDraftChanged(session._id)
  return state
}

async function undoLastPick (leagueSlug, expectedVersion) {
  const { league, session } = await getExistingDraft(leagueSlug)
  const state = await withSessionLock(session._id, async current => {
    checkVersion(current, expectedVersion)
    const pick = (await find('DraftPick', { draftSessionId: { id: String(current._id) } }, 'selectionNumber_DESC'))[0]
    if (!pick) throw new DraftError('There is no pick to undo', 409, 'NOTHING_TO_UNDO')
    try {
      await update('Team', pick.teamId, { players: { disconnect: [{ id: String(pick.playerId) }] } })
      await remove('DraftPick', pick._id)
      await updateSession(current, {
        currentPickNumber: pick.snakePosition,
        nextTeamOverrideId: pick.priorNextTeamOverrideId || null
      }, 'undo', { selectionNumber: pick.selectionNumber, teamId: pick.teamId, playerId: pick.playerId })
    } catch (error) {
      error.keepDraftLocked = true
      throw error
    }
    const updated = await sessionById(session._id)
    return buildState(league, updated, await loadDraftData(league, updated), { role: 'admin' })
  })
  notifyDraftChanged(session._id)
  return state
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
