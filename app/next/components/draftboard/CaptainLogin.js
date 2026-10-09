import { useState } from 'react'

export default function CaptainLogin ({ leagueSlug, teamSlug, teamName, onLogin }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async event => {
    event.preventDefault()
    if (busy) return
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
      <form className="card shadow-sm draft-room__card draft-login__card" onSubmit={submit} aria-busy={busy}>
        <div className="draft-login__lock text-primary" aria-hidden="true"><i className="fa fa-lock"></i></div>
        <div className="draft-room__eyebrow">Captain access</div>
        <h1>{teamName || 'Team'} draft room</h1>
        <p className="mt-2 mb-4">Enter your team password to view your roster and make picks.</p>
        {error && <div id="captain-login-error" className="alert alert-danger text-start" role="alert">{error}</div>}
        <label className="form-label" htmlFor="captain-password">Team password</label>
        <input
          id="captain-password"
          className="form-control form-control-lg"
          type="password"
          name="password"
          disabled={busy}
          aria-invalid={!!error}
          aria-describedby={error ? 'captain-login-error captain-login-help' : 'captain-login-help'}
          value={password}
          onChange={event => setPassword(event.target.value)}
          autoComplete="current-password"
          required
        />
        <p id="captain-login-help" className="form-text text-start mt-2 mb-0">Use the password shared by your commissioner, not your site login.</p>
        <button type="submit" className="btn btn-primary btn-lg" disabled={busy}>{busy ? 'Opening…' : 'Open draft room'}</button>
        <p className="small mb-0 mt-3">Need access? Ask your commissioner for your team link and password.</p>
      </form>
    </div>
  )
}
