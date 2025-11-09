import Head from 'next/head'
import { gql } from '@apollo/client'
import GraphqlClient from '../../lib/graphql-client'
import { HeaderNavigation } from '../../components/Navigation'
import LeagueUtils from '../../lib/league-utils'

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

  const event = results.data.allEvents.map(function (event) {
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

  return { props: { event, league } }
}

export default function EventItemPage (props) {
  const { event, league } = props
  console.log(event)
  return (
    <>
      <Head>
        <title>South Florida Events</title>
        <meta property="og:title" content="South Florida Events"/>
        <meta property="og:url" content="https://www.sflultimate.com/events"/>
        <meta property="og:description" content="See what events are local to the South Florida area!"/>
      </Head>
      <HeaderNavigation league={league} />
      <p>test</p>
    </>
  )
};
