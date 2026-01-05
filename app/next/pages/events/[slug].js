import Head from 'next/head'
import { gql } from '@apollo/client'
import GraphqlClient from '../../lib/graphql-client'
import { HeaderNavigation } from '../../components/Navigation'
import LeagueUtils from '../../lib/league-utils'
import NotFound from 'next/error'
import { createSummary } from '../../lib/utils'
import { AddToCalendar } from '../../components/AddToCalendar'

export const getServerSideProps = async (context) => {
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
        allEvents(where: {slug: "${context.params.slug}"} sortBy: startTime_DESC) {
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
        }
      }`
  })

  const league = JSON.parse(JSON.stringify(results.data.allLeagues[0]))
  LeagueUtils.addLeagueStatus(league)

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

  return { props: { event: events[0] || null, league } }
}

export default function EventItemPage (props) {
  const { event, league } = props

  if (!event) {
    return <NotFound statusCode={404} />
  }

  return (
    <>
      <Head>
        <title>Event: {event.name}</title>
        <meta property="og:title" content="South Florida Events"/>
        <meta property="og:url" content={'https://www.sflultimate.com/events/' + event.slug}/>
        <meta property="og:description" content={createSummary(event, 140)}/>
        <meta property="og:image" content={event.image.publicUrl} />
      </Head>
      <HeaderNavigation league={league} />

      <div className="container">
        <div className="row">
          <div className="col-md-6 offset-md-3">
            <img src={event.image.publicUrl} className="img-fluid" alt=""/>
            <h1>{event.name}</h1>
            <small className="text-muted">{event.category}</small>
            <p className="lead" style={{ marginBottom: 0 }}>{event.startTimeFormatted}<br/><small>{event.location}</small></p>
            <div style={{ marginBottom: '1rem' }}>
              <AddToCalendar event={event} />
            </div>
            <div dangerouslySetInnerHTML={{ __html: event.description }}/>
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
