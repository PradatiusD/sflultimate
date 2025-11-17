import Head from 'next/head'
import { HeaderNavigation } from '../../../components/Navigation'
import { getLeagueStats } from '../../../lib/stat-utils'
import StatTable from '../../../components/StatsTable'

export const getServerSideProps = async (context) => {
  const statsInfo = getLeagueStats(context)
  statsInfo.url = context.req.url
  return statsInfo
}

export default function ArchivedStatsPage (props) {
  const { league, players, awards, statKeysToCompare, playerGameStats, url } = props
  return (
    <>
      <Head>
        <title>{league.title} Stats</title>
        <meta property="og:title" content={league.title + ' Stats'}/>
        <meta property="og:url" content={'https://www.sflultimate.com/' + url} />
        <meta property="og:description" content={'Find out who made the big plays during ' + league.title}/>
        <style>
          {
            `
             .badge.Female {
                background-color: #F25974;
              }
              .badge.Male {
                background-color: #4A7CEC;
              }
              tbody a {
                color: #333333;
                text-decoration: underline;
              }
            `
          }

        </style>
      </Head>
      <HeaderNavigation league={league} />
      <div className="container">
        <h1>{league.title} Stats</h1>
        {
          playerGameStats.length > 0
            ? (
            <>
              <h2>Leaderboard</h2>
              <StatTable players={players} awards={awards} startRowNumber={1} endRowNumber={10} statKeysToCompare={statKeysToCompare} />
              <h2>Rising Contenders</h2>
              <StatTable players={players} awards={awards} startRowNumber={11} statKeysToCompare={statKeysToCompare} />
            </>
              )
            : (
              <>
                <p className="alert alert-info">We're awaiting stats information for this leaderboard to update.  Check back later!</p>
              </>
              )
        }
      </div>
    </>
  )
}
