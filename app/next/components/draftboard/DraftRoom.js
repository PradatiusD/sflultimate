import { useEffect, useMemo, useState } from 'react'
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
    <section className={`draft-room__status ${reminder.isViewerTurn ? 'draft-room__status--yours' : ''}`} data-cy="draft-status">
      <div className="draft-room__status-icon">{paused ? '⏸' : reminder.isViewerTurn ? '🔥' : '⏱'}</div>
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
    <section className="draft-room__card draft-room__roster" style={{ '--draft-team-color': team.color || '#804399' }}>
      <div className="draft-room__team-stripe"></div>
      <div className="draft-room__card-header">
        <div>
          <div className="draft-room__eyebrow">{ownTeam ? 'Your roster' : 'Team roster'}</div>
          <h2>{team.name} <span className="draft-room__count">{team.roster.length}</span></h2>
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
        {team.roster.length === 0 && <li className="draft-room__empty">No players selected yet.</li>}
      </ol>
    </section>
  )
}

function DraftQueue ({ state }) {
  return (
    <section className="draft-room__card draft-room__queue-card">
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
    <section className="draft-room__card">
      <div className="draft-room__card-header"><h3>Recent picks</h3></div>
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

  const save = async team => {
    const password = passwords[team.id] || ''
    if (password.length < 8) return window.alert('Use a password with at least 8 characters.')
    setSavingTeamId(team.id)
    try {
      const result = await mutate('/api/draft/admin', {
        league: leagueSlug,
        action: 'setPassword',
        teamId: team.id,
        password
      })
      if (result) setPasswords(current => ({ ...current, [team.id]: '' }))
    } finally {
      setSavingTeamId(null)
    }
  }

  return (
    <div className="draft-room__passwords">
      {state.teams.map(team => (
        <div key={team.id}>
          <span className="draft-room__team-dot" style={{ backgroundColor: team.color || '#804399' }}></span>
          <strong>{team.name}</strong>
          <input
            type="password"
            value={passwords[team.id] || ''}
            onChange={event => setPasswords(current => ({ ...current, [team.id]: event.target.value }))}
            placeholder={team.captainPasswordSet ? 'Set a new password' : 'Minimum 8 characters'}
            aria-label={`${team.name} captain password`}
          />
          <button className="btn btn-outline-primary btn-sm" onClick={() => save(team)} disabled={savingTeamId === team.id}>
            {team.captainPasswordSet ? 'Reset' : 'Set password'}
          </button>
          <span className={team.captainPasswordSet ? 'text-success' : 'text-muted'}>{team.captainPasswordSet ? '✓ Ready' : 'Not set'}</span>
          <a href={`/leagues/${leagueSlug}/draftboard/captain/${team.slug}`} target="_blank" rel="noreferrer">Captain page ↗</a>
        </div>
      ))}
    </div>
  )
}

function CommissionerControls ({ leagueSlug, state, mutate, selectedTeamId, setSelectedTeamId, advanceOrder, setAdvanceOrder, overrideNote, setOverrideNote }) {
  const statusAction = state.session.status === 'setup'
    ? 'start'
    : state.session.status === 'active'
      ? 'pause'
      : state.session.status === 'paused'
        ? 'resume'
        : null
  const statusLabel = statusAction === 'start' ? 'Start draft' : statusAction === 'pause' ? 'Pause draft' : 'Resume draft'

  const runAction = async action => {
    if (action === 'complete' && !window.confirm('Mark this draft complete? Captains will no longer be able to pick.')) return
    if (action === 'undo' && !window.confirm('Undo the most recent pick and restore the previous turn?')) return
    await mutate('/api/draft/admin', {
      league: leagueSlug,
      action,
      expectedVersion: state.session.version
    })
  }

  const setNextTeam = async () => {
    const teamId = window.prompt(`Enter the team number to receive the next turn:\n${state.teams.map((team, index) => `${index + 1}. ${team.name}`).join('\n')}\n\nLeave blank to restore snake order.`)
    if (teamId === null) return
    const team = teamId.trim() ? state.teams[Number(teamId) - 1] : null
    if (teamId.trim() && !team) return window.alert('That team number is not valid.')
    await mutate('/api/draft/admin', {
      league: leagueSlug,
      action: 'setNextTeam',
      teamId: team?.id || null,
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
    <section className="draft-room__card draft-room__admin" data-cy="commissioner-controls">
      <div className="draft-room__admin-heading">
        <div><div className="draft-room__eyebrow">Commissioner controls</div><h2>Snake order is the default, not a restriction</h2></div>
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
        <label className="draft-room__checkbox"><input type="checkbox" checked={advanceOrder} onChange={event => setAdvanceOrder(event.target.checked)} /> Advance order after pick</label>
        <button className="btn btn-outline-secondary" onClick={setNextTeam}>Set next team…</button>
        {(selectedTeamId !== state.session.currentTeamId || !advanceOrder) && (
          <label className="draft-room__override-note">Optional override note
            <input className="form-control" value={overrideNote} onChange={event => setOverrideNote(event.target.value)} maxLength="240" placeholder="Example: makeup pick after a late arrival" />
          </label>
        )}
      </div>
      <div className="draft-room__admin-footer">
        <label><input type="checkbox" checked={Boolean(state.session.showCommentsToCaptains)} onChange={toggleComments} /> Share registration comments with captains</label>
        <button className="btn btn-outline-danger btn-sm" onClick={() => runAction('undo')} disabled={state.picks.length === 0}>Undo last pick</button>
      </div>
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
    <section className="draft-room__card draft-room__players">
      <div className="draft-room__card-header draft-room__players-header">
        <div><h2>Available players <span className="draft-room__count">{state.availablePlayers.length}</span></h2><p>Everyone shown is still available to draft.</p></div>
        <div className="draft-room__filters">
          <input className="form-control" type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search players…" />
          <select className="form-select" value={gender} onChange={event => setGender(event.target.value)}>
            <option value="all">All players</option>
            <option value="Female">W matching</option>
            <option value="Male">M matching</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>
      <div className="table-responsive">
        <table className="table table-hover draft-room__player-table">
          <thead><tr><th>Player</th><th>Match</th><th>Positions</th><th>Rating</th><th>Attend.</th><th></th></tr></thead>
          <tbody>
          {filtered.map(player => (
            <tr key={player.id}>
              <td><strong>{player.firstName} {player.lastName}</strong>{player.comments && <small>{player.comments}</small>}</td>
              <td>{player.gender?.charAt(0)}</td>
              <td>{player.preferredPositions || '—'}</td>
              <td><span className="draft-room__rating">★ {getScore(player)}</span></td>
              <td>{player.participation ? `${player.participation}%` : '—'}</td>
              <td><button className="btn btn-primary btn-sm" disabled={!canPick} onClick={() => onPick(player)} data-cy={`pick-${player.id}`}>{state.viewer.role === 'admin' ? 'Draft' : 'Pick'}</button></td>
            </tr>
          ))}
          {filtered.length === 0 && <tr><td colSpan="6" className="draft-room__empty">No players match those filters.</td></tr>}
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
        headers: { 'content-type': 'application/json' },
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
  if (!state) return <div className="alert alert-info">Loading draft room…</div>

  const viewerTeam = state.viewer.role === 'captain' ? getTeam(state, state.viewer.teamId) : getTeam(state, selectedTeamId) || state.teams[0]
  const captainCanPick = state.viewer.role === 'captain' && reminder.isViewerTurn
  const canPick = !busy && state.session.status === 'active' && (state.viewer.role === 'admin' || captainCanPick)

  const pick = async player => {
    const targetTeam = state.viewer.role === 'admin' ? getTeam(state, selectedTeamId) : viewerTeam
    const isOverride = state.viewer.role === 'admin' && (targetTeam.id !== state.session.currentTeamId || !advanceOrder)
    const detail = isOverride ? '\n\nThis is a commissioner override.' : ''
    if (!window.confirm(`Draft ${player.firstName} ${player.lastName} to ${targetTeam.name}?${detail}`)) return
    await mutate('/api/draft/pick', {
      league: leagueSlug,
      playerId: player.id,
      teamId: targetTeam.id,
      advanceOrder,
      overrideNote,
      expectedVersion: state.session.version
    })
  }

  return (
    <div className="draft-room">
      {draft.error && <div className="alert alert-danger" role="alert">{draft.error}</div>}
      {draft.connectionStatus === 'reconnecting' && <div className="alert alert-warning">Reconnecting to the live draft…</div>}
      <DraftStatus state={state} reminder={reminder} />
      {state.viewer.role === 'admin' && (
        <CommissionerControls
          leagueSlug={leagueSlug}
          state={state}
          mutate={mutate}
          selectedTeamId={selectedTeamId}
          setSelectedTeamId={setSelectedTeamId}
          advanceOrder={advanceOrder}
          setAdvanceOrder={setAdvanceOrder}
          overrideNote={overrideNote}
          setOverrideNote={setOverrideNote}
        />
      )}
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
