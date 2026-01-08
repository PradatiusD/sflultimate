'use client'
import Countdown from 'react-countdown'
import { useEffect, useState } from 'react'

export default function Notification () {
  const [pathname, setPathname] = useState('')
  useEffect(() => {
    setPathname(window.location.pathname)
  }, [])

  const config = {
    title: 'Winter Beach League Registration',
    url: '/leagues/winter-beach-league-2026/register'
  }
  const registrationCloseDate = new Date('2026-01-09T04:59:00.000Z')
  if (registrationCloseDate.getTime() < Date.now() || pathname === config.url) {
    return <></>
  }
  return (
    <div className="container">
      <div className="alert alert-info" role="alert">
        <span className="glyphicon glyphicon-info-sign" style={{ position: 'relative', top: '2px' }}></span>{' '}
        <strong><a href={config.url}></a>{config.title} closes <u>soon</u>:</strong>
        {' '} only{' '}
        <Countdown
          date={registrationCloseDate.getTime()}
          intervalDelay={1000}
          precision={0}
          renderer={(props) => {
            return (
              <>
                <span><strong>{props.days}</strong> days</span>
                {', '}
                <span><strong>{props.hours}</strong> hours</span>
                {', '}
                <span><strong>{props.minutes}</strong> minutes</span>
                {', '}
                <span><strong>{props.seconds}</strong> seconds</span>
              </>
            )
          }}
        />
        {' '}left before you can <a href={config.url}>sign up</a>!
      </div>
    </div>

  )
}
