import Head from 'next/head'
import { gql } from '@apollo/client'
import GraphqlClient from "../lib/graphql-client";
import {HeaderNavigation} from "../components/Navigation";
import {addLeagueStatus} from "../lib/payment-utils";

export const getServerSideProps = async () => {
  const results = await GraphqlClient.query({
    query: gql`
          query {
            allLeagues(where:{isActive: true}) {
              id
              title
              earlyRegistrationStart
              earlyRegistrationEnd
              registrationStart
              registrationEnd
              lateRegistrationStart
              lateRegistrationEnd
            }
            allEvents {
              id
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
  
  const league = JSON.parse(JSON.stringify(results.data.allLeagues[0]))
  addLeagueStatus(league)
  
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
      hour: '2-digit',
      minute: '2-digit',
      day: 'numeric',
      timeZone: 'America/New_York'
    })

    return event
  })
  
  return { props: { events, league } }
}

function EventItem (props) {
  const {event, status} = props
  const containerClass = "row " + (status === 'past' ? ' text-muted': '')
  return (
    <div className={containerClass}>
      <div className="col-sm-3">
        <a href={event.image.publicUrl} target="_blank" rel="noopener noreferrer">
          <img src={event.image.publicUrl} className="img-responsive" alt={event.name}/>
        </a>
      </div>
      <div className="col-sm-9">
        <h2>{event.name}</h2>
        <p>
          <strong>{event.startTimeFormatted}</strong>
          <br/>
          <em>{event.location}</em> • {event.category}
        </p>
        <p>{event.description}</p>
        <ul className="list-inline">
          {event.links.map((link, linkIndex) => (
            <li key={linkIndex}>
              <a className="btn btn-default" href={link.url} target="_blank" rel="noopener noreferrer">
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default function EventsPage(props) {
  const {events, league} = props
  return (
    <>
      <Head>
        <title>South Florida Events</title>
        <meta property="og:title" content="South Florida Events"/>
        <meta property="og:url" content="https://www.sflultimate.com/events"/>
        <meta property="og:description" content="See what events are local to the South Florida area!"/>
      </Head>
      <HeaderNavigation league={league} />
      <div className="container">
        <h1>Calendar</h1>
        <iframe
          src="https://docs.google.com/spreadsheets/d/e/2PACX-1vS1QbLcE0hE72nw--gBLaNKwIYX3P8YZr9w8TMz2yqL62qIkXxxoRcmNXLT_whp5mg_oVfV5dwV23mh/pubhtml?widget=true&headers=false#gid=1961170570"
          width="100%"
          frameBorder="0"
          style={{height: '980px'}}
        ></iframe>

        <h1>Upcoming Events</h1>
        <p className="lead">Below you will find our list of upcoming events.</p>

        {events.map((event, index) =>
          event.active ? <EventItem event={event} /> : null
        )}

        <hr/>

        <h1>Past Events</h1>
        <p className="lead">Here you can find our list of past events.</p>

        {events.map((event, index) =>
          !event.active ? <EventItem event={event} status="past" /> : null
        )}
      </div>
    </>
  )
};
