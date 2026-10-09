import { useEffect, useMemo, useState } from 'react'
import Modal from '../Modal'
import useDraftState from './useDraftState'
import useTurnReminder from './useTurnReminder'

function getScore (player) {
  if (player.skillLevel) return Number(player.skillLevel).toFixed(1)
  const total = (player.athleticismLevel || 0) + (player.experienceLevel || 0) + (player.throwsLevel || 0)
  return (total * ((player.participation || 100) / 100)).toFixed(1)
}

function getTeam (state, teamId) {
  return state.teams.find(team => team.id === teamId)
}

async function readResponse (response) {
  const body = await response.json()
  if (!response.ok) {
    const error = new Error(body.error || 'The draft action could not be completed')
    error.code = body.code
    throw error
  }
  return body
}

function DraftStatus ({ state, reminder }) {
  const currentTeam = getTeam(state, state.session.currentTeamId)
  const suggestedTeam = getTeam(state, state.session.suggestedTeamId)
  const nextTeam = getTeam(state, state.session.upcomingTeamIds[1])
  const paused = state.session.status === 'paused'
  const complete = state.session.status === 'completed'
  const setup = state.session.status === 'setup'

  let eyebrow = 'Now drafting'
  let title = `${currentTeam?.name || 'A team'} are on the clock`
  let subtitle = `Round ${state.session.roundNumber}, pick ${state.session.currentPickNumber + 1}`
  if (setup) {
    eyebrow = 'Draft setup'
    title = 'Set captain passwords, then start the draft'
    subtitle = 'The player board is ready for the commissioner.'
  } else if (paused) {
    eyebrow = 'Draft paused'
    title = `The next pick remains with ${currentTeam?.name}`
    subtitle = 'Captains cannot make picks until the commissioner resumes.'
  } else if (complete) {
    eyebrow = 'Draft complete'
    title = 'All teams are set'
    subtitle = `${state.picks.length} selections were recorded.`
  } else if (reminder.isViewerTurn) {
    eyebrow = 'Your turn'
    title = 'Your team is on the clock'
    subtitle = `Round ${state.session.roundNumber}, pick ${state.session.currentPickNumber + 1}`
  } else if (state.session.isTeamOverride) {
    eyebrow = 'Commissioner-adjusted turn'
    subtitle = `${suggestedTeam?.name} was next in the default snake order.`
  } else if (nextTeam) {
    subtitle += ` · ${nextTeam.name} is next`
  }

  return (
    <section className={`card draft-room__status ${reminder.isViewerTurn ? 'draft-room__status--yours' : ''}`} data-cy="draft-status" role="status" aria-live="polite">
      <div className="draft-room__status-icon" aria-hidden="true">{paused ? '⏸' : reminder.isViewerTurn ? '🔥' : '⏱'}</div>
      <div className="draft-room__status-copy">
        <div className="draft-room__eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {state.viewer.role === 'captain' && (
        <button className="btn btn-outline-secondary btn-sm" onClick={reminder.enable} disabled={reminder.enabled}>
          {reminder.enabled ? '✓ Reminders enabled' : '🔔 Enable reminders'}
        </button>
      )}
    </section>
  )
}

function TeamRoster ({ team, ownTeam }) {
  return (
    <section className="card draft-room__card draft-room__roster" style={{ '--draft-team-color': team.color || '#804399' }}>
      <div className="draft-room__team-stripe"></div>
      <div className="card-header bg-white draft-room__card-header">
        <div>
          <div className="draft-room__eyebrow">{ownTeam ? 'Your roster' : 'Team roster'}</div>
          <h2>{team.name} <span className="badge bg-light text-dark draft-room__count">{team.roster.length}</span></h2>
        </div>
      </div>
      <ol className="draft-room__roster-list">
        {team.roster.map((player, index) => (
          <li key={player.id}>
            <span>{index + 1}</span>
            <strong>{player.firstName} {player.lastName}</strong>
            <small>{player.gender?.charAt(0)} {player.isCaptain ? '· Captain' : ''}</small>
          </li>
        ))}
        {team.roster.length === 0 && <li className="draft-room__empty d-block">No players selected yet.</li>}
      </ol>
    </section>
  )
}

function DraftQueue ({ state }) {
  return (
    <section className="card draft-room__card draft-room__queue-card">
      <h3>Up next</h3>
      <div className="draft-room__queue">
        {state.session.upcomingTeamIds.slice(0, 4).map((teamId, index) => {
          const team = getTeam(state, teamId)
          return (
            <div key={`${teamId}-${index}`} className={index === 0 ? 'is-current' : ''}>
              <span style={{ backgroundColor: team?.color || '#804399' }}></span>
              {team?.name}
            </div>
          )
        })}
      </div>
    </section>
  )
}

function PickHistory ({ state }) {
  return (
    <section className="card draft-room__card">
      <div className="card-header bg-white draft-room__card-header"><h3>Recent picks</h3></div>
      <div className="draft-room__history">
        {state.picks.slice().reverse().slice(0, 8).map(pick => (
          <div key={pick.id}>
            <span>{pick.advancedSequence ? `#${pick.snakePosition + 1}` : '—'}</span>
            <p><strong>{pick.player.firstName} {pick.player.lastName}</strong><small>{pick.teamName}</small></p>
            {pick.isCommissionerOverride && <em title={pick.overrideNote || 'Commissioner override'}>Override</em>}
          </div>
        ))}
        {state.picks.length === 0 && <p className="draft-room__empty">No picks yet.</p>}
      </div>
    </section>
  )
}

function PasswordSetup ({ leagueSlug, state, mutate }) {
  const [passwords, setPasswords] = useState({})
  const [savingTeamId, setSavingTeamId] = useState(null)
  const [savedTeamId, setSavedTeamId] = useState(null)

  const save = async team => {
    const password = passwords[team.id] || ''
    if (password.length < 8) return
    setSavedTeamId(null)
    setSavingTeamId(team.id)
    try {
      const result = await mutate('/api/draft/admin', {
        league: leagueSlug,
        action: 'setPassword',
        teamId: team.id,
        password
      })
      if (result) {
        setPasswords(current => ({ ...current, [team.id]: '' }))
        setSavedTeamId(team.id)
      }
    } finally {
      setSavingTeamId(null)
    }
  }

  return (
    <div className="draft-room__passwords">
      {state.teams.map(team => (
        <form key={team.id} onSubmit={event => {
          event.preventDefault()
          save(team)
        }}>
          <span className="draft-room__team-dot" style={{ backgroundColor: team.color || '#804399' }}></span>
          <strong>{team.name}</strong>
          <input
            type="password"
            className="form-control"
            autoComplete="new-password"
            minLength={8}
            required
            value={passwords[team.id] || ''}
            onChange={event => setPasswords(current => ({ ...current, [team.id]: event.target.value }))}
            placeholder={team.captainPasswordSet ? 'Set a new password' : 'Minimum 8 characters'}
            aria-label={`${team.name} captain password`}
          />
          <button className="btn btn-outline-primary btn-sm" type="submit" disabled={savingTeamId !== null}>
            {savingTeamId === team.id ? 'Saving…' : team.captainPasswordSet ? 'Reset' : 'Set password'}
          </button>
          <span className={team.captainPasswordSet ? 'text-success' : 'text-muted'}>{team.captainPasswordSet ? '✓ Ready' : 'Not set'}</span>
          <a href={`/leagues/${leagueSlug}/draftboard/captain/${team.slug}`} target="_blank" rel="noreferrer">Captain page ↗</a>
        </form>
      ))}
      <p className="small text-success mb-0" role="status">{savedTeamId ? `Password saved for ${getTeam(state, savedTeamId)?.name}.` : ''}</p>
    </div>
  )
}

function CommissionerControls ({ leagueSlug, state, mutate, selectedTeamId, setSelectedTeamId, advanceOrder, setAdvanceOrder, overrideNote, setOverrideNote, busy }) {
  const [nextTeamId, setNextTeamId] = useState('')
  const [confirmation, setConfirmation] = useState(null)
  const statusAction = state.session.status === 'setup'
    ? 'start'
    : state.session.status === 'active'
      ? 'pause'
      : state.session.status === 'paused'
        ? 'resume'
        : null
  const statusLabel = statusAction === 'start' ? 'Start draft' : statusAction === 'pause' ? 'Pause draft' : 'Resume draft'

  const runAction = async action => {
    if (action === 'complete' || action === 'undo') {
      setConfirmation({ action, version: state.session.version })
      return
    }
    await mutate('/api/draft/admin', {
      league: leagueSlug,
      action,
      expectedVersion: state.session.version
    })
  }

  const setNextTeam = async () => {
    await mutate('/api/draft/admin', {
      league: leagueSlug,
      action: 'setNextTeam',
      teamId: nextTeamId || null,
      expectedVersion: state.session.version
    })
  }

  const toggleComments = async event => {
    await mutate('/api/draft/admin', {
      league: leagueSlug,
      action: 'settings',
      showCommentsToCaptains: event.target.checked,
      expectedVersion: state.session.version
    })
  }

  return (
    <section className="card draft-room__card draft-room__admin" data-cy="commissioner-controls">
      <fieldset disabled={busy} className="border-0 p-0 m-0" aria-busy={busy}>
      <div className="draft-room__admin-heading">
        <div><div className="draft-room__eyebrow">Commissioner controls</div><h2>Manage the draft</h2><p className="text-muted small mb-0">Follow snake order or adjust a turn when needed.</p></div>
        <div className="draft-room__admin-buttons">
          {statusAction && <button className="btn btn-primary" onClick={() => runAction(statusAction)}>{statusLabel}</button>}
          {state.session.status !== 'completed' && <button className="btn btn-outline-secondary" onClick={() => runAction('complete')}>Finish</button>}
        </div>
      </div>

      {state.session.status === 'setup' && (
        <>
          <p className="text-muted">Set a password for each team. Passwords are hashed and cannot be viewed later.</p>
          <PasswordSetup leagueSlug={leagueSlug} state={state} mutate={mutate} />
        </>
      )}
      {state.session.status !== 'setup' && (
        <details className="draft-room__access-details">
          <summary>Captain passwords and team links</summary>
          <p className="text-muted">Reset a team password or open its captain page without interrupting the draft.</p>
          <PasswordSetup leagueSlug={leagueSlug} state={state} mutate={mutate} />
        </details>
      )}

      <div className="draft-room__admin-grid">
        <label>Team receiving commissioner pick
          <select className="form-select" value={selectedTeamId} onChange={event => setSelectedTeamId(event.target.value)}>
            {state.teams.map(team => <option key={team.id} value={team.id}>{team.name}{team.id === state.session.currentTeamId ? ' — next' : ''}</option>)}
          </select>
        </label>
        <label className="draft-room__checkbox"><input className="form-check-input" type="checkbox" checked={advanceOrder} onChange={event => setAdvanceOrder(event.target.checked)} /> Advance order after pick</label>
        <div>
          <label className="form-label" htmlFor="draft-next-team">Next turn</label>
          <div className="input-group">
            <select id="draft-next-team" className="form-select" value={nextTeamId} onChange={event => setNextTeamId(event.target.value)}>
              <option value="">Default snake order</option>
              {state.teams.map(team => <option key={team.id} value={team.id}>{team.name}</option>)}
            </select>
            <button className="btn btn-outline-secondary" onClick={setNextTeam}>Apply</button>
          </div>
        </div>
        {(selectedTeamId !== state.session.currentTeamId || !advanceOrder) && (
          <label className="draft-room__override-note">Optional override note
            <input className="form-control" value={overrideNote} onChange={event => setOverrideNote(event.target.value)} maxLength="240" placeholder="Example: makeup pick after a late arrival" />
          </label>
        )}
      </div>
      <div className="draft-room__admin-footer">
        <label><input className="form-check-input" type="checkbox" checked={Boolean(state.session.showCommentsToCaptains)} onChange={toggleComments} /> Share registration comments with captains</label>
        <button className="btn btn-outline-danger btn-sm" onClick={() => runAction('undo')} disabled={state.picks.length === 0}>Undo last pick</button>
      </div>
      </fieldset>
      <Modal id="draft-admin-confirm" isOpen={!!confirmation} onClose={() => setConfirmation(null)} closeDisabled={busy} title={confirmation?.action === 'undo' ? 'Undo last pick?' : 'Finish this draft?'} footer={<>
        <button className="btn btn-outline-secondary" disabled={busy} onClick={() => setConfirmation(null)}>Cancel</button>
        <button className="btn btn-danger" disabled={busy} onClick={async () => {
          await mutate('/api/draft/admin', { league: leagueSlug, action: confirmation.action, expectedVersion: confirmation.version })
          setConfirmation(null)
        }}>{busy ? 'Saving…' : 'Confirm'}</button>
      </>}>
        <p className="mb-0">{confirmation?.action === 'undo' ? 'The most recent player will return to the available board and the previous turn will be restored.' : 'Captains will no longer be able to make picks. Finish only when all selections are recorded.'}</p>
      </Modal>
    </section>
  )
}

function AvailablePlayers ({ state, onPick, canPick }) {
  const [search, setSearch] = useState('')
  const [gender, setGender] = useState('all')
  const filtered = useMemo(() => state.availablePlayers.filter(player => {
    const name = `${player.firstName} ${player.lastName}`.toLowerCase()
    const matchesSearch = !search || name.includes(search.toLowerCase()) || (player.preferredPositions || '').toLowerCase().includes(search.toLowerCase())
    return matchesSearch && (gender === 'all' || player.gender === gender)
  }), [gender, search, state.availablePlayers])

  return (
    <section className="card draft-room__card draft-room__players">
      <div className="card-header bg-white draft-room__card-header draft-room__players-header">
        <div><h2>Available players <span className="badge bg-light text-dark draft-room__count">{state.availablePlayers.length}</span></h2><p>Everyone shown is still available to draft.</p></div>
        <div className="draft-room__filters">
          <input className="form-control" type="search" aria-label="Search players by name or position" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search players…" />
          <select className="form-select" aria-label="Filter by matching category" value={gender} onChange={event => setGender(event.target.value)}>
            <option value="all">All players</option>
            <option value="Female">W matching</option>
            <option value="Male">M matching</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>
      <div className="table-responsive">
        <table className="table table-hover draft-room__player-table">
          <caption className="visually-hidden">Available players with matching category, preferred positions, rating and attendance</caption>
          <thead><tr><th scope="col">Player</th><th scope="col">Match</th><th scope="col">Positions</th><th scope="col">Rating</th><th scope="col">Attendance</th><th scope="col"><span className="visually-hidden">Select player</span></th></tr></thead>
          <tbody>
          {filtered.map(player => (
            <tr key={player.id}>
              <td><strong>{player.firstName} {player.lastName}</strong>{player.comments && <small>{player.comments}</small>}</td>
              <td>{player.gender?.charAt(0)}</td>
              <td>{player.preferredPositions || '—'}</td>
              <td><span className="draft-room__rating">★ {getScore(player)}</span></td>
              <td>{player.participation ? `${player.participation}%` : '—'}</td>
              <td><button className="btn btn-primary btn-sm" disabled={!canPick} onClick={() => onPick(player)} aria-label={`Draft ${player.firstName} ${player.lastName}`} data-cy={`pick-${player.id}`}>{state.viewer.role === 'admin' ? 'Draft' : 'Pick'}</button></td>
            </tr>
          ))}
          {filtered.length === 0 && <tr><td colSpan="6" className="draft-room__empty">{state.availablePlayers.length ? 'No players match those filters. Try another name or matching category.' : 'No players remain available to draft.'}</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default function DraftRoom ({ leagueSlug, initialState, setupError }) {
  const draft = useDraftState(leagueSlug, initialState)
  const state = draft.state
  const reminder = useTurnReminder(state)
  const [selectedTeamId, setSelectedTeamId] = useState(initialState?.session.currentTeamId || '')
  const [advanceOrder, setAdvanceOrder] = useState(true)
  const [overrideNote, setOverrideNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [pendingPick, setPendingPick] = useState(null)
  const stateVersion = state?.session.version
  const currentTeamId = state?.session.currentTeamId

  useEffect(() => {
    if (!stateVersion) return
    setSelectedTeamId(currentTeamId)
    setAdvanceOrder(true)
    setOverrideNote('')
  }, [currentTeamId, stateVersion])

  const mutate = async (url, body) => {
    setBusy(true)
    draft.setError('')
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-draft-viewer': state.viewer.role },
        credentials: 'same-origin',
        body: JSON.stringify(body)
      })
      const result = await readResponse(response)
      if (result.state) draft.setState(result.state)
      return result
    } catch (error) {
      draft.setError(error.message)
      if (error.code === 'STALE_DRAFT' || error.code === 'PLAYER_UNAVAILABLE') {
        try { await draft.refresh() } catch (refreshError) {}
      }
      return null
    } finally {
      setBusy(false)
    }
  }

  if (setupError) {
    return <div className="alert alert-warning"><h2>Draft setup needs attention</h2><p>{setupError}</p><a href="/admin/teams" className="btn btn-outline-primary">Open team administration</a></div>
  }
  if (!state) return <div className="alert alert-info" role="status">Loading draft room…</div>

  const viewerTeam = state.viewer.role === 'captain' ? getTeam(state, state.viewer.teamId) : getTeam(state, selectedTeamId) || state.teams[0]
  const captainCanPick = state.viewer.role === 'captain' && reminder.isViewerTurn
  const canPick = !busy && state.session.status === 'active' && (state.viewer.role === 'admin' || captainCanPick)

  const pick = player => {
    if (!canPick) return
    const targetTeam = state.viewer.role === 'admin' ? getTeam(state, selectedTeamId) : viewerTeam
    if (!targetTeam) return
    const isOverride = state.viewer.role === 'admin' && (targetTeam.id !== state.session.currentTeamId || !advanceOrder)
    setPendingPick({
      player,
      targetTeam,
      isOverride,
      body: {
        league: leagueSlug,
        playerId: player.id,
        teamId: targetTeam.id,
        advanceOrder,
        overrideNote,
        expectedVersion: state.session.version
      }
    })
  }

  return (
    <div className="draft-room">
      {draft.error && <div className="alert alert-danger" role="alert">{draft.error}</div>}
      {draft.connectionStatus === 'reconnecting' && <div className="alert alert-warning" role="status">Reconnecting to the live draft…</div>}
      <DraftStatus state={state} reminder={reminder} />
      {state.viewer.role === 'admin' && (
        <CommissionerControls
          leagueSlug={leagueSlug}
          state={state}
          mutate={mutate}
          busy={busy}
          selectedTeamId={selectedTeamId}
          setSelectedTeamId={setSelectedTeamId}
          advanceOrder={advanceOrder}
          setAdvanceOrder={setAdvanceOrder}
          overrideNote={overrideNote}
          setOverrideNote={setOverrideNote}
        />
      )}
      <Modal id="draft-pick-confirm" isOpen={!!pendingPick} onClose={() => setPendingPick(null)} closeDisabled={busy} title="Confirm your pick" footer={<>
        <button className="btn btn-outline-secondary" disabled={busy} onClick={() => setPendingPick(null)}>Cancel</button>
        <button className="btn btn-primary" disabled={busy} onClick={async () => {
          await mutate('/api/draft/pick', pendingPick.body)
          setPendingPick(null)
        }}>{busy ? 'Drafting…' : 'Confirm pick'}</button>
      </>}>
        {pendingPick && <>
          <p>Draft <strong>{pendingPick.player.firstName} {pendingPick.player.lastName}</strong> to <strong>{pendingPick.targetTeam.name}</strong>?</p>
          {pendingPick.isOverride && <div className="alert alert-warning mb-0">Commissioner override. {pendingPick.body.advanceOrder ? 'The draft order will advance.' : 'The draft order will not advance.'}</div>}
        </>}
      </Modal>
      <div className="draft-room__layout">
        <AvailablePlayers state={state} onPick={pick} canPick={canPick} />
        <aside className="draft-room__sidebar">
          {viewerTeam && <TeamRoster team={viewerTeam} ownTeam={state.viewer.role === 'captain'} />}
          <DraftQueue state={state} />
          <PickHistory state={state} />
        </aside>
      </div>
    </div>
  )
}
