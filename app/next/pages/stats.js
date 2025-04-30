import Head from 'next/head'
import { HeaderNavigation } from '../components/Navigation'
import { getLeagueStats } from '../lib/stat-utils'

export const getServerSideProps = async (context) => {
  return getLeagueStats(context)
}

function StatTable (props) {
  const { players, awards, startRowNumber, statKeysToCompare } = props
  return (
    <table className="table table-striped">
      <thead>
        <tr>
          <th>Rank</th>
          <th>Team Color</th>
          <th>First Name</th>
          <th>Last Name</th>
          <th>Assists</th>
          <th>Scores</th>
          <th>Defenses</th>
          <th>Overall</th>
        </tr>
      </thead>
      <tbody>
        {
          players.map((player, index) => {
            return (
              <tr key={player.id}>
                <td>{startRowNumber + index}</td>
                <td>
                  <span className="team-color" style={{ backgroundColor: player.teamColor }}></span>
                </td>
                <td>
                  <a href={player.url}>{player.firstName}</a>
                </td>
                <td>
                  <a href={player.url}>{player.lastName}</a>
                </td>
                {
                  statKeysToCompare.map((key) => {
                    return (
                      <td key={key}>
                        <span
                          className={awards[player.gender][key] === player[key] ? 'badge ' + player.gender : ''}>{player[key]}</span>
                      </td>
                    )
                  })
                }
              </tr>
            )
          })
        }
      </tbody>
    </table>
  )
}

export default function StatsPage (props) {
  const { league, players, awards, statKeysToCompare, playerGameStats } = props
  return (
    <>
      <Head>
        <title>League Stats</title>
        <meta property="og:title" content="League Stats"/>
        <meta property="og:url" content="https://www.sflultimate.com/stats"/>
        <meta property="og:description" content={'Find out who is making big plays for ' + league.title}/>
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
          playerGameStats.length > 0 ? (
            <>
              <h2>Leaderboard</h2>
              <StatTable players={players.slice(0, 10)} awards={awards} startRowNumber={1} statKeysToCompare={statKeysToCompare} />
              <h2>Rising Contenders</h2>
              <StatTable players={players.slice(10)} awards={awards} startRowNumber={11} statKeysToCompare={statKeysToCompare} />
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
