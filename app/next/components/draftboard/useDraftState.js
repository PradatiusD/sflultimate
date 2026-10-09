import { useCallback, useEffect, useRef, useState } from 'react'

export default function useDraftState (leagueSlug, initialState) {
  const [state, setState] = useState(initialState)
  const [connectionStatus, setConnectionStatus] = useState('connected')
  const [error, setError] = useState('')
  const stateRef = useRef(initialState)
  const hasState = Boolean(state)

  useEffect(() => {
    stateRef.current = state
  }, [state])

  const applyState = useCallback((nextState) => {
    stateRef.current = nextState
    setState(nextState)
    setError('')
    setConnectionStatus('connected')
  }, [])

  const refresh = useCallback(async () => {
    const response = await fetch(`/api/draft/state?league=${encodeURIComponent(leagueSlug)}`, {
      credentials: 'same-origin',
      headers: { 'x-draft-viewer': stateRef.current.viewer.role },
      cache: 'no-store'
    })
    const body = await response.json()
    if (!response.ok) throw new Error(body.error || 'Unable to refresh the draft')
    applyState(body.state)
    return body.state
  }, [applyState, leagueSlug])

  useEffect(() => {
    if (!hasState) return undefined
    let stopped = false
    let controller
    let retryDelay = 1000

    const poll = async () => {
      if (stopped) return
      controller = new AbortController()
      try {
        const version = stateRef.current.session.version
        const response = await fetch(`/api/draft/poll?league=${encodeURIComponent(leagueSlug)}&version=${version}`, {
          credentials: 'same-origin',
          headers: { 'x-draft-viewer': stateRef.current.viewer.role },
          cache: 'no-store',
          signal: controller.signal
        })
        const body = await response.json()
        if (!response.ok) throw new Error(body.error || 'Draft connection failed')
        if (body.changed && body.state) applyState(body.state)
        retryDelay = 1000
      } catch (pollError) {
        if (stopped || pollError.name === 'AbortError') return
        setConnectionStatus('reconnecting')
        setError('Connection interrupted. Reconnecting…')
        await new Promise(resolve => setTimeout(resolve, retryDelay))
        retryDelay = Math.min(retryDelay * 2, 10000)
      }
      poll()
    }

    poll()
    return () => {
      stopped = true
      if (controller) controller.abort()
    }
  }, [applyState, hasState, leagueSlug])

  return {
    state,
    setState: applyState,
    refresh,
    connectionStatus,
    error,
    setError
  }
}
