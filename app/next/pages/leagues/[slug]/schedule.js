import Head from 'next/head'
import { HeaderNavigation } from '../../../components/Navigation'
import { Schedule, getScheduleData } from '../../../components/Schedule'

export const getServerSideProps = async (context) => {
  return {
    props: await getScheduleData(context)
  }
}

export default function ArchivedSchedule (props) {
  const { league, leagues } = props
  return (
    <>
      <Head>
        <title>{league.title + ' Schedule'}</title>
        <meta property="og:title" content={`${league.title} Schedule`} />
        <meta property="og:url" content="https://www.sflultimate.com/schedule" />
        <meta property="og:description" content={'Discover the games schedule for ' + league.title} />
        <meta property="og:image" content="https://www.sflultimate.com/images/open-graph/schedule.jpg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
      </Head>
      <HeaderNavigation leagues={leagues} />
      <Schedule {...props} />
    </>
  )
}
