'use client'
import Countdown from 'react-countdown'

export default function Notification () {
  const registrationCloseDate = new Date('2025-10-05T03:59:59.000Z')
  if (registrationCloseDate.getTime() > Date.now()) {
    return <></>
  }
  return (
    <div className="container">
      <div className="alert alert-info" role="alert">
        <span className="glyphicon glyphicon-info-sign" style={{ position: 'relative', top: '2px' }}></span>{' '}
        <strong><a href="/register">Fall League Registration</a> closes soon:</strong>
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
        {' '}left before you can <a href="/register">sign up</a>!
      </div>
    </div>

  )
}
