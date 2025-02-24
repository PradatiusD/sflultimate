// const { getStandings } = require('./../stat-utils')

import GraphqlClient from '../../lib/graphql-client'
import { gql } from '@apollo/client'
import { HeaderNavigation } from '../../components/Navigation'
import { addLeagueStatus } from '../../lib/payment-utils'
export const getServerSideProps = async () => {
  const results = await GraphqlClient.query({
    query: gql`
      query {
        allLeagues(where:{isActive: true}) {
          title
          earlyRegistrationStart
          earlyRegistrationEnd
          registrationStart
          registrationEnd
          lateRegistrationStart
          lateRegistrationEnd
        }
      }`
  })
  const league = JSON.parse(JSON.stringify(results.data.allLeagues[0]))
  addLeagueStatus(league)

  return {
    props: {
      league,
      game: {
        league: {}
      },
      teams: []
    }
  }
}

export default function GamePage (props) {
  const { game, preview, teams, league } = props
  return (
    <>
      <HeaderNavigation league={league} />
      <div className="container">
        {preview ? (
          <p className="h1 text-center">Preview</p>
        ) : (
          <p className="h1 text-center">Recap</p>
        )}
        <p className="lead text-center">
          <strong>{game.league.title}</strong>
          <br/> {new Date(game.scheduledTime).toLocaleDateString('en-US', {
            month: 'long',
            weekday: 'long',
            day: 'numeric'
          })} - {new Date(game.scheduledTime).toLocaleTimeString('en-US', {
            timeZone: 'America/New_York',
            minute: 'numeric',
            hour: 'numeric'
          })}
          <br/> {game.location ? game.location.name : ''}
        </p>
        <div className="row">
          <p className="h3 text-center">Season Standings</p>
          <table className="table table-striped table-bordered">
            <thead>
              <tr>
                <th>Team Name</th>
                <th>Wins</th>
                <th>Losses</th>
                <th>Point Diff</th>
                <th>Points Scored</th>
                <th>Points Allowed</th>
                <th>Avg Points Scored</th>
                <th>Avg Points Allowed</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team, index) => (
                team.standing && (
                  <tr key={index}>
                    <td>{team.standing.name}</td>
                    <td>{team.standing.wins}</td>
                    <td>{team.standing.losses}</td>
                    <td>{team.standing.pointDiff}</td>
                    <td>{team.standing.pointsScored}</td>
                    <td>{team.standing.pointsAllowed}</td>
                    <td>{team.standing.avgPointsScoredPerGame}</td>
                    <td>{team.standing.avgPointsAllowedPerGame}</td>
                  </tr>
                )
              ))}
            </tbody>
          </table>
          {teams.map((team, index) => (
            <div className="col-sm-6" key={index}>
              <div className="text-center">
                {!preview && <p className="h1">{team.score}</p>}
                <h2>{team.name}</h2>
              </div>
              {preview ? (
                <>
                  <p><em>Note: Below are season-wide stats.</em></p>
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Assists</th>
                        <th>Scores</th>
                        <th>Defenses</th>
                        <th>Throwaways</th>
                        <th>Drops</th>
                      </tr>
                    </thead>
                    <tbody>
                      {team.stats.map((stat, index) => (
                        <tr key={index}>
                          <td>{stat.player.name.first} {stat.player.name.last}</td>
                          <td>{stat.assists}</td>
                          <td>{stat.scores}</td>
                          <td>{stat.defenses}</td>
                          <td>{stat.throwaways}</td>
                          <td>{stat.drops}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              ) : (
                <>
                  <h3>Attended</h3>
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Assists</th>
                        <th>Scores</th>
                        <th>Defenses</th>
                        <th>Throwaways</th>
                        <th>Drops</th>
                      </tr>
                    </thead>
                    <tbody>
                      {team.stats.filter(stat => stat.attended).map((stat, index) => (
                        <tr key={index}>
                          <td>{stat.player.name.first} {stat.player.name.last}</td>
                          <td>{stat.assists}</td>
                          <td>{stat.scores}</td>
                          <td>{stat.defenses}</td>
                          <td>{stat.throwaways}</td>
                          <td>{stat.drops}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <h3>Missing</h3>
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>Name</th>
                      </tr>
                    </thead>
                    <tbody>
                      {team.stats.filter(stat => !stat.attended).map((stat, index) => (
                        <tr key={index}>
                          <td>{stat.player.name.first} {stat.player.name.last}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

//
//   const $find = {
//     _id: new ObjectID(req.params.gameID)
//   }
//
//   locals.game = await Game.model.findOne($find)
//     .populate('homeTeam')
//     .populate('awayTeam')
//     .populate('location')
//     .populate('league', '-description -pricing -finalsTournament').lean().exec()
//
//   locals.standings = await getStandings({
//     currentLeague: locals.game.league._id
//   })
//
//   for (const standing of locals.standings) {
//     if (standing.teamId === locals.game.homeTeam._id.toString()) {
//       locals.game.homeTeam.standing = standing
//     } else if (standing.teamId === locals.game.awayTeam._id.toString()) {
//       locals.game.awayTeam.standing = standing
//     }
//   }
//
//   const playerMap = {}
//   for (const key of ['homeTeam', 'awayTeam']) {
//     for (const player of locals.game[key].players) {
//       playerMap[player.toString()] = key
//     }
//   }
//
//   let stats = await PlayerGameStat.model.find({
//     game: $find._id
//   }).populate('player', 'name').lean().exec()
//
//   stats = stats.map((stat) => {
//     stat.throwaways = stat.throwaways || 0
//     stat.drops = stat.drops || 0
//     return stat
//   })
//
//   // If no stats, show preview state of all stats
//   if (stats.length === 0) {
//     locals.preview = true
//     const currentSeasonGames = await Game.model.find({
//       league: locals.game.league._id
//     }, { _id: 1 }).lean()
//
//     const playerFind = {
//       game: {
//         $in: currentSeasonGames.map(game => game._id)
//       },
//       player: {
//         $in: locals.game.homeTeam.players.concat(locals.game.awayTeam.players)
//       }
//     }
//     stats = await PlayerGameStat.model.find(playerFind).populate('player', 'name').lean().exec()
//     // Now I need to reduce to season records
//     const statMap = {}
//     for (const stat of stats) {
//       const id = stat.player._id.toString()
//       stat.throwaways = stat.throwaways || 0
//       stat.drops = stat.drops || 0
//       if (!statMap[id]) {
//         statMap[id] = stat
//       } else {
//         statMap[id].assists += stat.assists || 0
//         statMap[id].scores += stat.scores || 0
//         statMap[id].defenses += stat.defenses || 0
//         statMap[id].throwaways += stat.throwaways || 0
//         statMap[id].drops += stat.drops || 0
//       }
//     }
//     stats = Object.values(statMap)
//   }
//
//   const awayTeamStats = stats.filter(function (stat) {
//     return playerMap[stat.player._id.toString()] === 'awayTeam'
//   })
//
//   function totalContributionDescending (a, b) {
//     const diff = (b.assists + b.scores + b.defenses) - (a.assists + a.scores + a.defenses)
//     if (diff !== 0) {
//       return diff
//     }
//     return a.player.name.first.localeCompare(b.player.name.first)
//   }
//
//   const homeTeamStats = stats.filter(function (stat) {
//     return playerMap[stat.player._id.toString()] === 'homeTeam'
//   })
//
//   awayTeamStats.sort(totalContributionDescending)
//   homeTeamStats.sort(totalContributionDescending)
//
//   locals.teams = [
//     {
//       score: locals.game.awayTeamScore,
//       name: locals.game.awayTeam.name,
//       standing: locals.game.awayTeam.standing,
//       stats: awayTeamStats
//     },
//     {
//       score: locals.game.homeTeamScore,
//       name: locals.game.homeTeam.name,
//       standing: locals.game.homeTeam.standing,
//       stats: homeTeamStats
//     }
//   ]
//
//   // Render the view
//   view.render('game')
// }

/*

block head
    meta(property="og:title"        content=locals.league.title + ' ' + 'Matchup: ' + teams[0].name  + " vs " + teams[1].name)
    meta(property="og:url"          content="https://www.sflultimate.com/game/" + game._id)
    if preview
        meta(property="og:description"  content="Game Preview: " + teams[0].name  + " vs " + teams[1].name + " - " + game.scheduledTime.toLocaleDateString('en-US', {month: 'long', weekday: 'long', day: 'numeric'}))
    else
        meta(property="og:description"  content="Game Recap: " + teams[0].name  + " vs " + teams[1].name + " - " + game.scheduledTime.toLocaleDateString('en-US', {month: 'long', weekday: 'long', day: 'numeric'}))
 */
