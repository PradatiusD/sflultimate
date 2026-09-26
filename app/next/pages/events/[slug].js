import { gql } from '@apollo/client'
import GraphqlClient from '../../lib/server-graphql-client'
import { HeaderNavigation } from '../../components/Navigation'
import NotFound from 'next/error'
import { createSummary, showDate, showHourMinute } from '../../lib/utils'
import { AddToCalendar } from '../../components/AddToCalendar'
import { updateWithGlobalServerSideProps } from '../../lib/global-server-side-props'
import SeoHead from '../../components/SeoHead'
import ShortcodeContent from '../../components/ShortcodeContent'
import EventRegistrationForm from '../../components/EventRegistrationForm'

function relativeTime (date, now) {
  const seconds = Math.max(0, Math.floor((now - new Date(date).getTime()) / 1000))
  if (seconds < 45) return 'just now'
  if (seconds < 90) return '1 minute ago'
  if (seconds < 2700) return `${Math.floor(seconds / 60)} minutes ago`
  if (seconds < 5400) return '1 hour ago'
  if (seconds < 79200) return `${Math.floor(seconds / 3600)} hours ago`
  if (seconds < 129600) return '1 day ago'
  return `${Math.floor(seconds / 86400)} days ago`
}

function attendeeName (name) {
  const parts = name.trim().split(/\s+/)
  return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.` : parts[0]
}

function createEventOpenGraphDescription (event) {
  const date = showDate(event.startTime, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
  const time = `${showHourMinute(event.startTime)} to ${showHourMinute(event.endTime)}`

  return `Join us for ${event.name} on ${date}, from ${time} at ${event.location}. ${createSummary(event, 140)}`
}

export const getServerSideProps = async (context) => {
  const { expandArticleShortcodes } = require('../../lib/article-shortcodes')
  const results = await GraphqlClient.query({
    query: gql`
      query($slug: String!) {
        allEvents(where: {slug: $slug} sortBy: startTime_DESC) {
          id
          image {
            publicUrl
          }
          slug
          name
          description
          location
          category
          startTime
          endTime
          moreInformationUrl
          allowRegistrations
          registrationPrice
        }
        allEventRegistrations(where: {event: {slug: $slug}, status: submitted} sortBy: createdAt_DESC first: 1000) {
          name
          createdAt
        }
      }`,
    variables: { slug: context.params.slug }
  })

  const registrations = results.data.allEventRegistrations
  const now = Date.now()
  const events = results.data.allEvents.map(function (event) {
    event = JSON.parse(JSON.stringify(event))
    const { html, footerScripts } = expandArticleShortcodes(event.description || '')
    event.descriptionHtml = html
    event.footerScripts = footerScripts
    event.links = []
    if (event.moreInformationUrl) {
      event.links.push({
        label: 'More Information',
        url: event.moreInformationUrl
      })
    }
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
    event.registrations = registrations.map(registration => ({
      name: attendeeName(registration.name),
      signedUpAgo: relativeTime(registration.createdAt, now)
    }))

    return event
  })

  const props = { event: events[0] || null }
  await updateWithGlobalServerSideProps(props)
  return { props }
}

export default function EventItemPage (props) {
  const { event, leagues } = props

  if (!event) {
    return <NotFound statusCode={404} />
  }

  const seoDescription = createSummary(event, 140)
  const ogDescription = createEventOpenGraphDescription(event)

  return (
    <>
      <SeoHead
        title={`Event: ${event.name}`}
        ogTitle={event.name + ' | SFL Community Events'}
        description={seoDescription}
        ogDescription={ogDescription}
        path={`/events/${event.slug}`}
        image={event.image?.publicUrl}
      />
      <HeaderNavigation leagues={leagues} />
      <div className="container">
        <div className="row">
          <div className="col-md-6 offset-md-3">
            {event.image && event.image.publicUrl && (
              <img src={event.image.publicUrl} className="img-fluid" alt=""/>
            )}
            <h1>{event.name}</h1>
            <small className="text-muted">{event.category}</small>
            <p className="lead" style={{ marginBottom: 0 }}>{event.startTimeFormatted}<br/><small>{event.location}</small></p>
            {
              event.registrations.length && (
                <>
                  <p className="mb-1 mt-2"><strong>Who&#39;s signed up so far</strong></p>
                  <div className="d-flex flex-wrap gap-2 mb-3" role="list">
                    {event.registrations.map((registration, i) => <span className="badge text-bg-primary event-registration-attendee" role="listitem" key={`${registration.name}-${i}`}>{registration.name}</span>)}
                  </div>
                </>
              )
            }
            <div style={{ marginBottom: '1rem' }}>
              <AddToCalendar event={event} />
            </div>
            <ShortcodeContent html={event.descriptionHtml} footerScripts={event.footerScripts} />
            {event.registrations.length > 0 && <section className="mt-4 mb-4">
              <p><strong>Latest signups</strong></p>
              <div className="event-registration-latest" aria-label="Latest signups">
                <div className="event-registration-latest-track">
                  {event.registrations.slice(0, 5).concat(event.registrations.slice(0, 5)).map((registration, i) => <span className="badge text-bg-light border event-registration-latest-item" aria-hidden={i >= Math.min(event.registrations.length, 5)} key={`${registration.name}-${i}`}>{registration.name} <small className="text-muted">{registration.signedUpAgo}</small></span>)}
                </div>
              </div>
              <style jsx>{`
                .event-registration-latest { overflow: hidden; }
                .event-registration-latest-track { animation: event-registration-latest-loop 18s linear infinite; display: flex; gap: 0.75rem; width: max-content; }
                .event-registration-latest-item { flex: 0 0 auto; font-size: 0.9rem; }
                @keyframes event-registration-latest-loop { to { transform: translateX(calc(-50% - 0.375rem)); } }
                @media (prefers-reduced-motion: reduce) { .event-registration-latest-track { animation: none; } }
              `}</style>
            </section>}
            {
              event.allowRegistrations && (
                <div className="mt-4 mb-4">
                  <EventRegistrationForm
                    eventId={event.id}
                    eventName={event.name}
                    price={event.registrationPrice}
                  />
                </div>
              )
            }
            {
              event.links.map((link, i) => {
                return (
                  <a className="btn btn-block btn-primary" href={link.url} key={link.url} target="_blank">{link.label}</a>
                )
              })
            }
          </div>
        </div>
      </div>
    </>
  )
};
