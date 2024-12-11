import GraphqlClient from '../lib/graphql-client'
import { gql } from '@apollo/client'
import Head from 'next/head'
import {buildPlayerUrl} from "../components/PlayerLink";

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

//     query.then(function (response) {
//       let statEntries = response.data.stats
//
//       const playerIDMap = {}
//       for (const player of response.data.players) {
//         player.url = window.sflUtils.buildPlayerUrl(player)
//         playerIDMap[player._id] = player
//       }
//
//       const playerToTeamColorMap = {}
//       for (const team of response.data.teams) {
//         const ids = team.captains.concat(team.players)
//         for (const id of ids) {
//           playerToTeamColorMap[id] = team.color
//         }
//       }
//
//       statEntries = statEntries.map(function (entry) {
//         entry.overall = entry.assists + entry.scores + entry.defenses
//         entry.teamColor = playerToTeamColorMap[entry.player]
//         Object.assign(entry, playerIDMap[entry.player])
//         return entry
//       })
//
//
//       const awards = {
//         Male: {},
//         Female: {}
//       }
//
//
//       keys.forEach(function (key) {
//         awards.Female[key] = 0
//         awards.Male[key] = 0
//       })
//
//       for (let i = 0; i < statEntries.length; i++) {
//         const p = statEntries[i]
//         const gender = p.gender
//
//         if (gender === 'Female') {
//           for (let j = 0; j < keys.length; j++) {
//             const key = keys[j]
//             if (p[key] > awards.Female[key]) {
//               awards.Female[key] = p[key]
//             }
//           }
//         }
//
//         if (gender === 'Male') {
//           for (let j = 0; j < keys.length; j++) {
//             const key = keys[j]
//             if (p[key] > awards.Male[key]) {
//               awards.Male[key] = p[key]
//             }
//           }
//         }
//       }
//

export const getServerSideProps = async () => {
  const results = await GraphqlClient.query({
    query: gql`
      query {
        allLeagues(where: {isActive: true}) {
          title
        },
        allPlayerGameStats(where: {game: {league: {isActive: true}}}) {
          scores
          assists
          defenses
          player {
            id
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
          color,
          players {
            id
          }
        }
      }`
  })
  const statsGroupedByPlayer = {}
  
  for (const stat of results.data.allPlayerGameStats) {
    if (statsGroupedByPlayer[stat.player.id]) {
      const o = statsGroupedByPlayer[stat.player.id]
      o.scores += stat.scores
      o.assists += stat.assists
      o.defenses += stat.defenses
    } else {
      statsGroupedByPlayer[stat.player.id] = stat
    }
  }
  const league = JSON.parse(JSON.stringify(results.data.allLeagues[0]))
  const players = JSON.parse(JSON.stringify(results.data.allPlayers)).map(function (player) {
    Object.assign(player, statsGroupedByPlayer[player.id])
    player.overall = player.scores + player.assists + player.defenses
    player.url = buildPlayerUrl(player)
    return player
  }).sort(function (a, b) {
    return b.overall - a.overall
  })
  return { props: { league, players } }
}

function StatTable (props) {
  const statKeysToCompare = ['assists', 'scores', 'defenses', 'overall']
  const {players, awards, startRowNumber} = props
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
          const teamColor = 'red'

          return (
            <tr key={player.id}>
              <td>{startRowNumber + index}</td>
              <td>
                <span className="team-color" style={{'background-color': teamColor}}></span>
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
                        className={awards[player.gender][key] === player[key] ? 'badge ' + player.gender : ''}></span>{player[key]}
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

export default function Stats(props) {
  const {league, players} = props
  const awards = {Male: {}, Female: {}, Other: {}}
  return (
    <>
      <Head>
        <meta property="og:title" content="League Stats"/>
        <meta property="og:url" content="https://www.sflultimate.com/stats"/>
        <meta property="og:description" content={'Find out who is making big plays for ' + league.title}/>
        <style>
          {/*.badge.Female {*/}
          {/*  background-color: #F25974;*/}
          {/*}*/}
          {/*.badge.Male {*/}
          {/*  background-color: #4A7CEC;*/}
          {/*}*/}
          {/*tbody a {*/}
          {/*  color: #333333;*/}
          {/*  text-decoration: underline;*/}
          {/*}*/}
        </style>
      </Head>
      <div className="container">
        <h1>{league.title} Stats</h1> 
        <h2>Leaderboard</h2>
        <StatTable players={players.slice(0, 10)} awards={awards} startRowNumber={1} />
        <h2>Rising Contenders</h2>
        <StatTable players={players.slice(10)} awards={awards} startRowNumber={11} />
      </div>
    </>
  )
}
