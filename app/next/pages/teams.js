import { HeaderNavigation } from '../components/Navigation'
import LeagueTeams, { getLeagueTeamsData } from '../components/LeagueTeams'
import SeoHead from '../components/SeoHead'
export const getServerSideProps = async (context) => {
  return await getLeagueTeamsData(context)
}

export default function LeagueTeamsPage (props) {
  const { league, leagues } = props
  return (
    <>
      <SeoHead
        title={`${league.title} Teams`}
        description={'Find out who is on your team for ' + league.title}
        path="/teams"
        image="https://d137pw2ndt5u9c.cloudfront.net/keystone/69b0cdc048055400282f2dbb-league-teams%20(1).jpg"
        imageWidth={1200}
        imageHeight={630}
      />
      <HeaderNavigation leagues={leagues}/>
      <LeagueTeams {...props} />
    </>
  )
}
