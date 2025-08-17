import Head from 'next/head'
import { HeaderNavigation } from '../../../components/Navigation'
import LeagueTeams, { getLeagueTeamsData } from '../../../components/LeagueTeams'
export const getServerSideProps = async (context) => {
  return await getLeagueTeamsData(context)
}

export default function LeagueTeamsPage (props) {
  const { league, url } = props
  return (
    <>
      <Head>
        <title>{league.title} Teams</title>
        <meta property="og:title" content={'League ' + league.title} />
        <meta property="og:url" content={'https://www.sflultimate.com/' + url} />
        <meta property="og:description" content={'Find out who is on your team for ' + league.title}/>
        <meta property="og:image" content="https://www.sflultimate.com/images/open-graph/homepage.jpg"/>
        <meta property="og:image:width" content="1200"/>
        <meta property="og:image:height" content="630"/>
      </Head>
      <HeaderNavigation league={league}/>
      <LeagueTeams {...props} />
    </>
  )
}
