import { HeaderNavigation } from '../../../components/Navigation'
import LeagueTeams, { getLeagueTeamsData } from '../../../components/LeagueTeams'
import SeoHead from '../../../components/SeoHead'
export const getServerSideProps = async (context) => {
  return await getLeagueTeamsData(context)
}

export default function LeagueTeamsPage (props) {
  const { leagues, league, url, teams } = props
  return (
    <>
      <SeoHead
        title={teams.length > 0 ? `${league.title} Teams` : `${league.title} Current Signups`}
        ogTitle={`League ${league.title}`}
        description={teams.length > 0 ? `Find out who is on your team for ${league.title}` : `Curious to see who's registered for ${league.title}? Find out!`}
        path={url}
        image={league.registrationShareImage?.publicUrl}
        imageWidth={1200}
        imageHeight={630}
      />
      <HeaderNavigation leagues={leagues} />
      <LeagueTeams {...props} />
    </>
  )
}
