import { useEffect, useRef, useState } from 'react'

function playChime () {
  const AudioContext = window.AudioContext || window.webkitAudioContext
  if (!AudioContext) return
  const context = new AudioContext()
  const oscillator = context.createOscillator()
  const gain = context.createGain()
  oscillator.frequency.value = 660
  gain.gain.setValueAtTime(0.12, context.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.45)
  oscillator.connect(gain)
  gain.connect(context.destination)
  oscillator.start()
  oscillator.stop(context.currentTime + 0.45)
}

export default function useTurnReminder (state) {
  const [enabled, setEnabled] = useState(false)
  const previousTurn = useRef(state?.session.currentTeamId)
  const viewerTeamId = state?.viewer.teamId
  const isViewerTurn = Boolean(
    viewerTeamId &&
    state?.session.status === 'active' &&
    state?.session.currentTeamId === viewerTeamId
  )

  const enable = async () => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      await Notification.requestPermission()
    }
    setEnabled(true)
  }

  useEffect(() => {
    const currentTurn = state?.session.currentTeamId
    const becameViewerTurn = enabled && viewerTeamId && currentTurn === viewerTeamId && previousTurn.current !== viewerTeamId
    if (becameViewerTurn) {
      playChime()
      if (navigator.vibrate) navigator.vibrate([180, 80, 180])
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        // eslint-disable-next-line no-new
        new Notification('Your team is on the clock', {
          body: `Open the ${state.league.title} draft room to make your pick.`
        })
      }
    }
    previousTurn.current = currentTurn
  }, [enabled, state?.session.currentTeamId, state?.league.title, viewerTeamId])

  useEffect(() => {
    if (!viewerTeamId) return undefined
    const originalTitle = document.title
    if (isViewerTurn && document.hidden) document.title = '🔥 YOUR PICK — SFL Ultimate'
    const updateTitle = () => {
      document.title = isViewerTurn && document.hidden ? '🔥 YOUR PICK — SFL Ultimate' : originalTitle
    }
    document.addEventListener('visibilitychange', updateTitle)
    return () => {
      document.removeEventListener('visibilitychange', updateTitle)
      document.title = originalTitle
    }
  }, [isViewerTurn, viewerTeamId])

  return { enabled, enable, isViewerTurn }
}
