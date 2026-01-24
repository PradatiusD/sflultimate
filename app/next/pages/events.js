import Head from 'next/head'
import { gql } from '@apollo/client'
import GraphqlClient from '../lib/graphql-client'
import { HeaderNavigation } from '../components/Navigation'
import { AddToCalendar } from '../components/AddToCalendar'
import {updateWithGlobalServerSideProps} from "../lib/global-server-side-props";

export const getServerSideProps = async () => {
  const results = await GraphqlClient.query({
    query: gql`
          query {
            allEvents(sortBy: startTime_DESC) {
              id
              slug
              image {
                publicUrl
              }
              name
              description
              location
              category
              startTime
              endTime
              moreInformationUrl
            }
        }`
  })

  const events = results.data.allEvents.map(function (event) {
    event = JSON.parse(JSON.stringify(event))
    event.links = []
    if (event.moreInformationUrl) {
      event.links.push({
        label: 'More Information',
        url: event.moreInformationUrl
      })
    }
    const now = Date.now()
    event.active = now < new Date(event.endTime).getTime()
    event.startTimeFormatted = new Date(event.startTime).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      weekday: 'long',
      hour: 'numeric',
      minute: '2-digit',
      day: 'numeric',
      timeZone: 'America/New_York'
    })

    return event
  })

  const props = {events}
  await updateWithGlobalServerSideProps(props)
  return { props }
}

function EventItem (props) {
  const { event, status } = props
  const isPast = status === 'past'
  const containerClass = 'row ' + (isPast ? ' text-muted' : '')
  const eventUrl = '/events/' + event.slug
  return (
    <>
      <div className={containerClass}>
        <div className="col-sm-3">
          {
            event.image && (
              <a href={event.image.publicUrl} target="_blank" rel="noopener noreferrer">
                <img src={event.image.publicUrl} className="img-responsive img-rounded" alt={event.name}/>
              </a>
            )
          }
        </div>
        <div className="col-sm-9">
          <h2><a href={eventUrl}>{event.name}</a></h2>
          <p>
            <strong>{event.startTimeFormatted}</strong>
            <br/>
            <em>{event.location}</em> • {event.category}
          </p>

          <div dangerouslySetInnerHTML={{ __html: event.description }}/>
          <ul className="list-inline" style={{ marginTop: '1rem' }}>
            <li>
              <a className="btn btn-default event-btn" href={eventUrl}>
                View Event
              </a>
            </li>
            <li>
              {
                !isPast && (
                  <AddToCalendar event={event} />
                )
              }
            </li>
          </ul>
        </div>
      </div>
      <hr/>
    </>
  )
}

export default function EventsPage (props) {
  const { events, leagues } = props

  const upcomingEvents = events.filter((event) => event.active)
  upcomingEvents.sort((a, b) => {
    return a.startTime.localeCompare(b.startTime)
  })
  return (
    <>
      <Head>
        <title>South Florida Ultimate • Upcoming & Past Events</title>
        <meta property="og:title" content="South Florida Events"/>
        <meta property="og:url" content="https://www.sflultimate.com/events"/>
        <meta property="og:description" content="See what events are local to the South Florida area!"/>
      </Head>
      <HeaderNavigation leagues={leagues} />
      <div className="container">

        <h1>Upcoming Events</h1>
        <p className="lead">Below you will find a list of upcoming events happening in our community.</p>

        {
          upcomingEvents.map((event) => (
            <EventItem event={event} key={event.id} />
          ))
        }

        <h1 style={{ display: 'none' }}>SFLUltimate Yearly Calendar</h1>
        <iframe
          src="https://docs.google.com/spreadsheets/d/e/2PACX-1vS1QbLcE0hE72nw--gBLaNKwIYX3P8YZr9w8TMz2yqL62qIkXxxoRcmNXLT_whp5mg_oVfV5dwV23mh/pubhtml?widget=true&headers=false#gid=1961170570"
          width="100%"
          style={{ height: '980px', display: 'none' }}
        ></iframe>

        <h1>Past Events</h1>
        <p className="lead">Here you can find our list of past events.</p>

        {events.map((event) =>
          !event.active ? <EventItem event={event} key={event.id} status="past" /> : null
        )}
      </div>
    </>
  )
};
