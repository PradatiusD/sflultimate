import Head from 'next/head'
import { HeaderNavigation } from '../components/Navigation'
import LeagueTeams, { getLeagueTeamsData } from '../components/LeagueTeams'
export const getServerSideProps = async (context) => {
  return await getLeagueTeamsData(context)
}

export default function LeagueTeamsPage (props) {
  const { league, leagues } = props
  return (
    <>
      <Head>
        <title>League Teams</title>
        <meta property="og:title" content="League Teams"/>
        <meta property="og:url" content="https://www.sflultimate.com/teams"/>
        <meta property="og:description" content={'Find out who is on your team for ' + league.title}/>
        <meta property="og:image" content="https://d137pw2ndt5u9c.cloudfront.net/keystone/69b0cdc048055400282f2dbb-league-teams%20(1).jpg"/>
        <meta property="og:image:width" content="1200"/>
        <meta property="og:image:height" content="630"/>
      </Head>
      <HeaderNavigation leagues={leagues}/>
      <LeagueTeams {...props} />
    </>
  )
}
