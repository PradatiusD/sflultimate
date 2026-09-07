import { HeaderNavigation } from '../../../components/Navigation'
import { Schedule } from '../../../components/Schedule'
import { getScheduleData } from '../../../lib/schedule-data'
import SeoHead from '../../../components/SeoHead'

export const getServerSideProps = async (context) => {
  return {
    props: await getScheduleData(context)
  }
}

export default function ArchivedSchedule (props) {
  const { league, leagues } = props
  return (
    <>
      <SeoHead
        title={league.title + ' Schedule'}
        description={'Discover the games schedule for ' + league.title}
        path={`/leagues/${league.slug}/schedule`}
        image="https://www.sflultimate.com/images/open-graph/schedule.jpg"
        imageWidth={1200}
        imageHeight={630}
      />
      <HeaderNavigation leagues={leagues} />
      <Schedule {...props} />
    </>
  )
}
