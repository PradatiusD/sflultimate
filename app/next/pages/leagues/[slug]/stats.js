import { HeaderNavigation } from '../../../components/Navigation'
import { getLeagueStats } from '../../../lib/stat-utils'
import StatTable from '../../../components/StatsTable'
import SeoHead from '../../../components/SeoHead'

export const getServerSideProps = async (context) => {
  const statsInfo = await getLeagueStats(context)
  statsInfo.props.url = context.req.url
  return statsInfo
}

export default function ArchivedStatsPage (props) {
  const { league, players, leagues, awards, statKeysToCompare, playerGameStats, url } = props
  return (
    <>
      <SeoHead
        title={league.title + ' Stats'}
        description={'Find out who made the big plays during ' + league.title}
        path={url}
      >
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
      </SeoHead>
      <HeaderNavigation leagues={leagues} />
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
                <p className="alert alert-info">We&apos;re awaiting stats information for this leaderboard to update.  Check back later!</p>
              </>
              )
        }
      </div>
    </>
  )
}
