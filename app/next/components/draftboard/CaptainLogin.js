import { useState } from 'react'

export default function CaptainLogin ({ leagueSlug, teamSlug, teamName, onLogin }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async event => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const response = await fetch('/api/draft/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ league: leagueSlug, team: teamSlug, password })
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || 'Team or password is incorrect')
      onLogin(body.state)
    } catch (loginError) {
      setError(loginError.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="draft-login">
      <form className="draft-room__card draft-login__card" onSubmit={submit}>
        <div className="draft-login__lock">🔒</div>
        <div className="draft-room__eyebrow">Captain access</div>
        <h1>{teamName || 'Team'} draft room</h1>
        <p>Enter your team password to view your roster and make picks.</p>
        {error && <div className="alert alert-danger">{error}</div>}
        <label htmlFor="captain-password">Team password</label>
        <input
          id="captain-password"
          className="form-control form-control-lg"
          type="password"
          value={password}
          onChange={event => setPassword(event.target.value)}
          autoComplete="current-password"
          required
        />
        <button className="btn btn-primary btn-lg" disabled={busy}>{busy ? 'Opening…' : 'Open draft room'}</button>
      </form>
    </div>
  )
}
