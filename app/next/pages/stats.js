import GraphqlClient from '../lib/graphql-client'
import { gql } from '@apollo/client'
import Head from 'next/head'
import { buildPlayerUrl } from '../components/PlayerLink'
import { addLeagueStatus } from '../lib/payment-utils'
import { HeaderNavigation } from '../components/Navigation'

//
//   if (req.method === 'POST') {
//     const records = req.body.items.map((item) => {
//       if (!item._id) {
//         item._id = new ObjectID()
//         item.createdAt = new Date()
//       } else {
//         item.createdAt = new Date(item.createdAt)
//       }
//       item.updatedAt = new Date()
//       return item
//     })
//     const dbOperations = await PlayerGameStat.model.bulkWrite(records.map(doc => ({
//       updateOne: {
//         filter: { _id: doc._id },
//         update: doc,
//         upsert: true
//       }
//     })))
//
//     return res.json({
//       status: 'ok',
//       data: dbOperations
//     })
//   }
//

export const getServerSideProps = async () => {
  const results = await GraphqlClient.query({
    query: gql`
      query {
        allLeagues(where: {isActive: true}) {
          title
          earlyRegistrationStart
          earlyRegistrationEnd
          registrationStart
          registrationEnd
          lateRegistrationStart
          lateRegistrationEnd
        },
        allPlayerGameStats(where: {game: {league: {isActive: true}}}) {
          scores
          assists
          defenses
          player {
            id
            gender
          }
        }
        allPlayers(where: {leagues_some: {isActive: true}}) {
          id
          firstName
          lastName
          gender
        }
        allTeams(where: {league: {isActive: true}}) {
          id
          color
          players {
            id
          }
        }
      }`
  })
  const league = JSON.parse(JSON.stringify(results.data.allLeagues[0]))
  addLeagueStatus(league)
  const statsGroupedByPlayer = {}
  const awards = { Male: {}, Female: {}, Other: {} }
  const statKeysToCompare = ['assists', 'scores', 'defenses', 'overall']

  const playerGameStats = JSON.parse(JSON.stringify(results.data.allPlayerGameStats))
  for (const stat of playerGameStats) {
    let o
    if (statsGroupedByPlayer[stat.player.id]) {
      o = statsGroupedByPlayer[stat.player.id]
      o.scores += stat.scores
      o.assists += stat.assists
      o.defenses += stat.defenses
    } else {
      statsGroupedByPlayer[stat.player.id] = stat
      o = stat
    }
    o.overall = (o.scores + o.assists + o.defenses) || 0
  }

  for (const key in statsGroupedByPlayer) {
    const stat = statsGroupedByPlayer[key]
    const gender = stat.player.gender
    for (const key of statKeysToCompare) {
      const playerStat = stat[key]
      if (stat[key] && (!awards[gender][key] || awards[gender][key] < playerStat)) {
        awards[gender][key] = playerStat
      }
    }
  }

  for (const team of results.data.allTeams) {
    for (const player of team.players) {
      if (!statsGroupedByPlayer[player.id]) {
        statsGroupedByPlayer[player.id] = {
          scores: 0,
          assists: 0,
          defenses: 0,
          overall: 0
        }
      }
      statsGroupedByPlayer[player.id].teamColor = team.color
    }
  }
  const players = JSON.parse(JSON.stringify(results.data.allPlayers)).map(function (player) {
    Object.assign(player, statsGroupedByPlayer[player.id])
    player.url = buildPlayerUrl(player)
    return player
  }).sort(function (a, b) {
    return b.overall - a.overall
  })

  return { props: { league, players, statKeysToCompare, awards, playerGameStats } }
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
