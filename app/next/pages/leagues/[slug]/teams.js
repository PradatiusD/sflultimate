import Head from 'next/head'
import { HeaderNavigation } from '../../../components/Navigation'
import LeagueTeams, { getLeagueTeamsData } from '../../../components/LeagueTeams'
export const getServerSideProps = async (context) => {
  return await getLeagueTeamsData(context)
}

export default function LeagueTeamsPage (props) {
  const { leagues, league, url, teams } = props
  return (
    <>
      <Head>
        <title>{teams.length > 0 ? `${league.title} Teams` : `${league.title} Current Signups`}</title>
        <meta property="og:title" content={`League ${league.title}`} />
        <meta property="og:url" content={'https://www.sflultimate.com/' + url} />
        <meta
          property="og:description"
          content={teams.length > 0 ? `Find out who is on your team for ${league.title}` : `Curious to see who's registered for ${league.title}? Find out!`}
        />
        {
          league.registrationShareImage && league.registrationShareImage.publicUrl && (
            <meta property="og:image" content={league.registrationShareImage.publicUrl}/>
          )
        }
        <meta property="og:image:width" content="1200"/>
        <meta property="og:image:height" content="630"/>
      </Head>
      <HeaderNavigation leagues={leagues} />
      <LeagueTeams {...props} />
    </>
  )
}
