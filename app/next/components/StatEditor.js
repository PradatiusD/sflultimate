import { useState } from 'react'
import {
  mergeSavedStat,
  normalizeStatValue,
  validateGameScores,
  validateTeamStats
} from '../lib/stat-editor-utils'

function NumberControl ({ label, value, onChange, disabled }) {
  return (
    <div className="stat-number-control">
      <label>{label}</label>
      <div className="input-group">
        <button
          type="button"
          className="btn btn-outline-secondary"
          disabled={disabled || value <= 0}
          aria-label={`Decrease ${label}`}
          onClick={() => onChange(Math.max(0, value - 1))}
        >−</button>
        <input
          className="form-control text-center"
          type="number"
          inputMode="numeric"
          min="0"
          step="1"
          disabled={disabled}
          value={value}
          aria-label={label}
          onChange={event => onChange(normalizeStatValue(event.target.value))}
        />
        <button
          type="button"
          className="btn btn-outline-secondary"
          disabled={disabled}
          aria-label={`Increase ${label}`}
          onClick={() => onChange(value + 1)}
        >+</button>
      </div>
    </div>
  )
}

function StatTable ({ stats, editable, onStatChange }) {
  return (
    <table className="table table-bordered table-striped stat-editor-table">
      <thead>
        <tr>
          <th>Player Name</th>
          <th>Attended</th>
          <th>Assists</th>
          <th>Scores</th>
          <th>Defenses</th>
        </tr>
      </thead>
      <tbody>
        {stats.map(stat => (
          <tr key={stat.player.id}>
            <td>{stat.player.firstName} {stat.player.lastName}</td>
            <td>
              <input
                type="checkbox"
                disabled={!editable}
                checked={stat.attended}
                aria-label={`${stat.player.firstName} ${stat.player.lastName} attended`}
                onChange={event => onStatChange(stat.player.id, 'attended', event.target.checked)}
              />
            </td>
            {['assists', 'scores', 'defenses'].map(field => (
              <td key={field}>
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  step="1"
                  disabled={!editable}
                  value={stat[field]}
                  aria-label={`${stat.player.firstName} ${stat.player.lastName} ${field}`}
                  onChange={event => onStatChange(stat.player.id, field, normalizeStatValue(event.target.value))}
                />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function MobileStatCards ({ stats, editable, onStatChange }) {
  return (
    <div className="mobile-stat-list">
      {stats.map(stat => (
        <section className="card mobile-stat-card" key={stat.player.id}>
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h2 className="h5 mb-0">{stat.player.firstName} {stat.player.lastName}</h2>
              <label className="form-check-label attended-toggle">
                <input
                  className="form-check-input"
                  type="checkbox"
                  disabled={!editable}
                  checked={stat.attended}
                  onChange={event => onStatChange(stat.player.id, 'attended', event.target.checked)}
                />
                Played
              </label>
            </div>
            <div className="stat-number-grid">
              {['assists', 'scores', 'defenses'].map(field => (
                <NumberControl
                  key={field}
                  label={field.charAt(0).toUpperCase() + field.slice(1)}
                  value={stat[field]}
                  disabled={!editable}
                  onChange={value => onStatChange(stat.player.id, field, value)}
                />
              ))}
            </div>
          </div>
        </section>
      ))}
    </div>
  )
}

export default function StatEditor (props) {
  const {
    game,
    team,
    opponent,
    isHomeTeam,
    initialTeamScore,
    initialOpponentScore,
    initialStats,
    editable = true,
    mobile = false,
    showGameScores = editable
  } = props
  const [stats, setStats] = useState(initialStats)
  const [teamScore, setTeamScore] = useState(initialTeamScore ?? '')
  const [opponentScore, setOpponentScore] = useState(initialOpponentScore ?? '')
  const [errors, setErrors] = useState([])
  const [status, setStatus] = useState('idle')
  const validation = validateTeamStats(stats, teamScore)

  function onStatChange (playerId, field, value) {
    setStats(currentStats => currentStats.map(stat => {
      if (stat.player.id !== playerId) return stat
      return {
        ...stat,
        [field]: value,
        attended: field !== 'attended' && value > 0 ? true : (field === 'attended' ? value : stat.attended)
      }
    }))
    setErrors([])
    setStatus('idle')
  }

  function onScoreChange (setter) {
    return event => {
      const value = event.target.value
      setter(value === '' ? '' : Number(value))
      setErrors([])
      setStatus('idle')
    }
  }

  async function save () {
    const nextErrors = [
      ...validateGameScores(teamScore, opponentScore),
      ...validateTeamStats(stats, teamScore).errors
    ]

    if (nextErrors.length > 0) {
      setErrors([...new Set(nextErrors)])
      setStatus('invalid')
      return
    }

    setErrors([])
    setStatus('saving')

    const gameData = isHomeTeam
      ? { homeTeamScore: teamScore, awayTeamScore: opponentScore }
      : { homeTeamScore: opponentScore, awayTeamScore: teamScore }

    try {
      const response = await fetch('/api/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: game.id,
          gameData,
          stats: stats.map(stat => ({
            gameStatId: stat.gameStatId,
            playerId: stat.player.id,
            assists: stat.assists,
            scores: stat.scores,
            defenses: stat.defenses,
            attended: stat.attended
          }))
        })
      })

      if (!response.ok) throw new Error('Unable to save game stats')

      const { stats: savedStats } = await response.json()

      setStats(currentStats => currentStats.map(stat => {
        const saved = savedStats.find(result => result.player.id === stat.player.id)
        return mergeSavedStat(stat, saved)
      }))
      setStatus('saved')
    } catch (error) {
      setErrors(['Your stats could not be saved. Please try again.'])
      setStatus('error')
    }
  }

  return (
    <div className={mobile ? 'stat-editor stat-editor-mobile' : 'stat-editor'}>
      {showGameScores && (
        <div className="row g-3 game-score-editor">
          <div className="col-6">
            <label className="form-label" htmlFor={`team-score-${team.id}`}>{team.name} points</label>
            <input
              id={`team-score-${team.id}`}
              className="form-control form-control-lg"
              type="number"
              inputMode="numeric"
              min="0"
              step="1"
              disabled={!editable}
              value={teamScore}
              onChange={onScoreChange(setTeamScore)}
            />
          </div>
          <div className="col-6">
            <label className="form-label" htmlFor={`opponent-score-${team.id}`}>{opponent.name} points</label>
            <input
              id={`opponent-score-${team.id}`}
              className="form-control form-control-lg"
              type="number"
              inputMode="numeric"
              min="0"
              step="1"
              disabled={!editable}
              value={opponentScore}
              onChange={onScoreChange(setOpponentScore)}
            />
          </div>
        </div>
      )}

      <div className="stat-editor-totals" aria-live="polite">
        <span>Assists <strong>{validation.totals.assists}</strong></span>
        <span>Scores <strong>{validation.totals.scores}</strong></span>
        <span>Defenses <strong>{validation.totals.defenses}</strong></span>
      </div>

      {mobile
        ? <MobileStatCards stats={stats} editable={editable} onStatChange={onStatChange} />
        : <StatTable stats={stats} editable={editable} onStatChange={onStatChange} />}

      {validation.warnings.length > 0 && (
        <div className="alert alert-warning" role="status">
          <strong>Please double-check:</strong>
          <ul className="mb-0">
            {validation.warnings.map(warning => <li key={warning}>{warning}</li>)}
          </ul>
        </div>
      )}

      {errors.length > 0 && (
        <div className="alert alert-danger" role="alert">
          <strong>Please fix the following:</strong>
          <ul className="mb-0">
            {errors.map(error => <li key={error}>{error}</li>)}
          </ul>
        </div>
      )}
      {status === 'saved' && <div className="alert alert-success" role="status">Stats saved.</div>}

      {editable && (
        <button
          type="button"
          className="btn btn-primary btn-lg stat-editor-save"
          disabled={status === 'saving'}
          onClick={save}
        >
          {status === 'saving' ? 'Saving…' : `Save ${team.name} stats`}
        </button>
      )}

      <style jsx global>{`
        .stat-editor .game-score-editor { margin-bottom: 1rem; }
        .stat-editor .stat-editor-totals {
          display: flex;
          justify-content: space-around;
          gap: .75rem;
          position: sticky;
          top: 0;
          z-index: 10;
          margin-bottom: 1rem;
          padding: .75rem;
          border: 1px solid #ddd;
          border-radius: .5rem;
          background: #fff;
        }
        .stat-editor .stat-editor-table input[type='number'] { width: 5rem; }
        .stat-editor .mobile-stat-list { display: grid; gap: .75rem; }
        .stat-editor .mobile-stat-card { border-radius: .75rem; }
        .stat-editor .attended-toggle { display: flex; align-items: center; gap: .5rem; }
        .stat-editor .attended-toggle input { width: 1.3rem; height: 1.3rem; margin: 0; }
        .stat-editor .stat-number-grid { display: grid; gap: .75rem; }
        .stat-editor .stat-number-control label { display: block; margin-bottom: .25rem; font-weight: 600; }
        .stat-editor .stat-number-control .btn,
        .stat-editor .stat-number-control .form-control { min-height: 3rem; font-size: 1.15rem; }
        .stat-editor .stat-editor-save { width: 100%; min-height: 3.5rem; margin-bottom: 2rem; }
        .stat-editor .alert { margin-top: 1rem; }
        @media (min-width: 576px) {
          .stat-editor .stat-number-grid { grid-template-columns: repeat(3, 1fr); }
        }
      `}</style>
    </div>
  )
}
