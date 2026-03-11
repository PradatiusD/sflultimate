'use client'
import Countdown from 'react-countdown'
import { useEffect, useState } from 'react'

export default function Notification (props) {
  const { leagues } = props
  const [pathname, setPathname] = useState('')
  useEffect(() => {
    setPathname(window.location.pathname)
  }, [])

  if (!leagues) {
    return <></>
  }

  const activeLeague = leagues.find((league) => {
    return league.isActive
  })

  const destinationUrl = '/leagues/' + activeLeague.slug + '/register'

  const registrationCloseDate = new Date(activeLeague.registrationEnd)
  if (!activeLeague || registrationCloseDate.getTime() < Date.now() || pathname === destinationUrl) {
    return <></>
  }
  return (
    <div className="container">
      <div className="alert alert-info" role="alert">
        <i className="fa fa-info-circle me-2" aria-hidden="true"></i>
        <span className="glyphicon glyphicon-info-sign" style={{ position: 'relative', top: '2px' }}></span>{' '}
        <strong><a href={destinationUrl} target="_blank">{activeLeague.title} registration</a><u> closes soon</u>:</strong>
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
        {' '}left before you can <a href={destinationUrl} target="_blank">sign up</a>!
      </div>
    </div>

  )
}
