'use client'
import Countdown from 'react-countdown'
import { useEffect, useState } from 'react'

export default function Notification (props) {
  const { leagues } = props
  const [pathname, setPathname] = useState('')
  useEffect(() => {
    setPathname(window.location.pathname)
  }, [])

  if (!Array.isArray(leagues) || leagues.length === 0) {
    return <></>
  }

  const activeLeague = leagues.find((league) => {
    return league.isActive
  })

  if (!activeLeague || pathname === '/confirmation') {
    return <></>
  }

  const destinationUrl = '/leagues/' + activeLeague.slug + '/register'
  const registrationCloseDate = new Date(activeLeague.registrationEnd)
  if (!activeLeague || registrationCloseDate.getTime() < Date.now() || pathname === destinationUrl) {
    return <></>
  }
  return (
    <div className="container">
      <div className="alert alert-success" role="alert">
        <span className="fa fa-smile" style={{ position: 'relative', top: '2px' }}></span>{' '}
        <strong><a href={destinationUrl} target="_blank">{activeLeague.title} registration</a></strong>
        {
          registrationCloseDate.getTime() < Date.now() + (1000 * 60 * 60 * 24 * 7 * 3)
            ? (
            <>
              : {' '} only{' '}
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
              {' '}left to <a href={destinationUrl} target="_blank">sign up</a>!
            </>
              )
            : <>
            {' '} is available! <a href={destinationUrl} target="_blank"> Learn more or sign up</a>!
          </>
        }

      </div>
    </div>

  )
}
