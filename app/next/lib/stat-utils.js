import { gql } from '@apollo/client'
import LeagueUtils from './league-utils'
import GraphqlClient from './graphql-client'
import { buildPlayerUrl } from '../components/PlayerLink'

export async function getLeagueStats (context) {
  const variables = {}
  if (context && context.req.url.startsWith('/leagues/')) {
    variables.leagueCriteria = {
      title_i: context.req.url.split('/')[2].replace(/-/g, ' ')
    }
  } else {
    variables.leagueCriteria = {
      isActive: true
    }
  }
  const results = await GraphqlClient.query({
    query: gql`
      query($leagueCriteria: LeagueWhereInput) {
        allLeagues(where: $leagueCriteria) {
          title
          earlyRegistrationStart
          earlyRegistrationEnd
          registrationStart
          registrationEnd
          lateRegistrationStart
          lateRegistrationEnd
        },
        allPlayerGameStats(where: {game: {league: $leagueCriteria}}) {
          scores
          assists
          defenses
          player {
            id
            gender
          }
        }
        allPlayers(where: {leagues_some: $leagueCriteria}) {
          id
          firstName
          lastName
          gender
        }
        allTeams(where: {league: $leagueCriteria}) {
          id
          color
          players {
            id
          }
        }
      }`,
    variables: variables
  })
  const league = JSON.parse(JSON.stringify(results.data.allLeagues[0]))
  LeagueUtils.addLeagueStatus(league)
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
