import Head from 'next/head'
import { gql } from '@apollo/client'
import GraphqlClient from '../lib/graphql-client'

// const keystone = require('keystone')
// const Game = keystone.list('Game')
// const Team = keystone.list('Team')
// const Location = keystone.list('Location')
//

//   let games = await Game.model.find({
//     league: res.locals.league._id
//   }).sort({
//     scheduledTime: 1
//   }).lean().exec()
//
//   games = games.map((game) => {
//     game.scheduledTimeEpoch = game.scheduledTime.getTime()
//     return game
//   })
//
//   const teams = await Team.model.find({
//     league: res.locals.league._id
//   }).lean().exec()
//
//   const locations = await Location.model.find({}).lean().exec()
//   return res.json({ games, teams, locations, league: res.locals.league })
// }
//

export const getServerSideProps = (async () => {
  const results = await GraphqlClient.query({
    query: gql`
      query {
        allLeagues(where: {isActive: true}) {
          id
          title
          finalsTournamentDescription
          finalsTournamentEndDate
          finalsTournamentStartDate
        }
        allGames(where: {league: {isActive: true}}, sortBy: scheduledTime_ASC) {
          id
          scheduledTime
          homeTeam {
            name
          }
          homeTeamScore
          awayTeam {
            name
          }
          awayTeamScore
          location {
            name
          }
        }
        allTeams(where: {league: {isActive: true}}) {
          color
        }
      }`,
  });
  const league = results.data.allLeagues[0]
  const games = Array.from(results.data.allGames).sort((a, b) => {
    return new Date(a.scheduledTime).getTime() < new Date(b.scheduledTime).getTime()
  })
  console.log(games)
  return { props: {league, games}}
})

export default function Schedule (props) {
  const {league, games} = props
  return (
    <>
      <Head>
        <meta property="og:title" content="Spring League Schedule" />
        <meta property="og:url" content="https://www.sflultimate.com/schedule" />
        <meta property="og:description" content={'Discover the games schedule for ' + league.title} />
        <meta property="og:image" content="https://www.sflultimate.com/images/open-graph/schedule.jpg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
      </Head>
      <div className="container">
        <div className="schedule">
          <section>
            <h1>{league.title} Schedule</h1>
            <p className="lead">
              Pick your color to filter schedule by your team.<br/>
              <span className="team-color" ng-repeat="team in teams" ng-style="{'background-color': team.color}"
                    ng-click="filterScheduleFor(team)"></span>
            </p>
            <table className="table table-striped table-bordered">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Matchup</th>
                  <th>Field</th>
                  <th>Preview/Recap</th>
                </tr>
              </thead>
              <tbody>
                {
                  games.map((game, index) => {
                    return (
                      <tr className={(new Date(game.scheduledTime).getTime() < Date.now()) ?'text-muted': ''}>
                        <td>{new Date(game.scheduledTime).toLocaleDateString()}</td>
                        <td>{new Date(game.scheduledTime).toLocaleTimeString()}</td>
                        <td>
                          <span>{game.homeTeam.name} vs. {game.awayTeam.name}</span>
                          {
                            game.homeTeamScore && game.awayTeamScore && (!game.homeTeamForfeit && !game.homeTeamForfeit) && (
                              <span> ({game.homeTeamScore}-{game.awayTeamScore})</span>
                            )
                          }
                          {
                            game.homeTeamForfeit && (
                              <span>
                                <br/> {game.homeTeam.name} forfeited
                              </span>
                            )
                          }
                          {
                            game.awayTeamForfeit && (
                              <span>
                                <br/> {game.awayTeam.name} forfeited
                              </span>
                            )
                          }
                        </td>
                        <td>{game?.location?.name}</td>
                        <td>
                          <a href={"/game/" + game.id}>{new Date(game.scheduledTime).getTime() < Date.now() ? 'Recap' : 'Preview'}</a>
                        </td>
                      </tr>
                    )
                  })
                }
                <tr>
                  <td>{league.finalsTournamentStartDate}</td>
                  <td>{league.finalsTournamentStartDate} - {league.finalsTournamentEndDate}</td>
                  <td ng-bind-html="finalsTournament.description" style={{maxWidth: '529px'}}></td>
                  <td>{league.finalsTournamentLocation?.name}</td>
                </tr>
              </tbody>
            </table>
          </section>
        </div>
      </div>
    </>
  )
}

//       $scope.standings = {}
//       $scope.forfeits = {}
//       $scope.finalsTournament = {}
//
//       // Today plus one day of separation
//       var dayInMilliseconds = 1000 * 60 * 60 * 24
//       $scope.today = new Date().getTime() - dayInMilliseconds
//
//       $scope.colorFilter = function (item) {
//       return item
//     }
//
//       $scope.filterScheduleFor = function (team) {
//       $scope.colorFilter = function (game) {
//       if (game.awayTeam._id === team._id || game.homeTeam._id === team._id) {
//       return true
//     }
//     }
//     }
//
//       $http.get(window.sflUtils.addLeagueOverride('/schedule?f=json')).then(function (response) {
//       $scope.teams = {}
//       if (response.data.league.finalsTournament) {
//       $sce.trustAsHtml(response.data.league.finalsTournament.description)
//       $scope.finalsTournament = response.data.league.finalsTournament
//     }
//       for (const team of response.data.teams) {
//       $scope.teams[team._id] = team
//     }
//       $scope.locations = {}
//       for (const location of response.data.locations) {
//       $scope.locations[location._id] = location
//     }
//
//       $scope.games = response.data.games.map(function (game) {
//       game.homeTeam = $scope.teams[game.homeTeam]
//       game.awayTeam = $scope.teams[game.awayTeam]
//       return game
//     })
//
//       return $http.get('/stats')
//     }).then(function (response) {
//       return
//       var stats = response.data
//
//       stats = stats.split('\n')
//       var headers = stats.splice(0, 1)[0].split(',').map(function (column) {
//       if (column.indexOf('/') === -1) return column
//
//       var _date = column.match(/\d{1,}\/\d{1,}\/\d{1,}/)
//
//       var date = _date[0].split('/').map(function (d) {
//       if (d.length === 1) {
//       return '0' + d
//     }
//       return d
//     }).join('/')
//
//       column = column.replace(_date, date)
//       return column
//     })
//
//       var playedGames = headers.filter(function (d) {
//       return d.toLowerCase().indexOf('s\'s') > -1
//     })
//
//       stats = stats.map(function (stat, i) {
//       var o = {}
//       stat = stat.split(',')
//
//       stat.forEach(function (d, i) {
//       o[headers[i]] = d
//     })
//
//       return o
//     })
//
//       var scores = {}
//
//       stats.forEach(function (stat) {
//       var teamColor = stat['Team Color']
//
//       if (!scores[teamColor]) {
//       scores[teamColor] = {}
//     }
//
//       playedGames.forEach(function (playedGame) {
//       if (!scores[teamColor][playedGame]) {
//       scores[teamColor][playedGame] = 0
//     }
//
//       var points = stat[playedGame].length > 0 ? parseInt(stat[playedGame]) : 0
//
//       scores[teamColor][playedGame] += points
//     })
//     })
//
//       $scope.games = $scope.games.map(function (game) {
//       var date = $filter('date')(game.date, 'MM/dd/yy')
//
//       game.homeScore = scores[game.home][date + " S's"]
//       game.awayScore = scores[game.away][date + " S's"]
//
//       // add to team if home color is greater than away color
//       if (!$scope.standings[game.away]) {
//       $scope.standings[game.away] = {
//       wins: 0,
//       losses: 0,
//       pointDiff: 0
//     }
//     }
//
//       if (!$scope.standings[game.home]) {
//       $scope.standings[game.home] = {
//       wins: 0,
//       losses: 0,
//       pointDiff: 0
//     }
//     }
//
//       if (game.homeScore > 0 && game.awayScore > 0) {
//       var diff = game.homeScore - game.awayScore
//
//       var homeWon = diff > 0
//
//       var victorColor = homeWon ? game.home : game.away
//       var loserColor = homeWon ? game.away : game.home
//
//       var victorScore = homeWon ? game.homeScore : game.awayScore
//       var loserScore = homeWon ? game.awayScore : game.homeScore
//
//       $scope.standings[victorColor].wins += 1
//       $scope.standings[loserColor].losses += 1
//
//       var pointDiff = victorScore - loserScore
//
//       $scope.standings[victorColor].pointDiff += pointDiff
//       $scope.standings[loserColor].pointDiff -= pointDiff
//     }
//
//       return game
//     })
//
//       for (var k in $scope.forfeits) {
//       for (var i = 0; i < $scope.forfeits[k].length; i++) {
//       var forfeitVictor = $scope.forfeits[k][i]
//       var forfeitLoser = k
//
//       $scope.standings[forfeitVictor].wins += 1
//       $scope.standings[forfeitVictor].pointDiff += 7
//       $scope.standings[forfeitLoser].losses += 1
//       $scope.standings[forfeitLoser].pointDiff -= 7
//     }
//     }
//
//       console.log(JSON.stringify($scope.standings, null, 2))
//
//       $scope.standingsArr = []
//       for (var o in $scope.standings) {
//       $scope.standingsArr.push({
//       color: o,
//       wins: $scope.standings[o].wins,
//       losses: $scope.standings[o].losses,
//       pointDiff: $scope.standings[o].pointDiff
//     })
//     }
//
//       $scope.standingsArr = $scope.standingsArr.sort(function (a, b) {
//       if (a.wins > b.wins) return -1
//       if (a.wins < b.wins) return 1
//
//       if (a.pointDiff > b.pointDiff) return -1
//       if (a.pointDiff < b.pointDiff) return 1
//       return 0
//     })
//     }).catch(function (err) {
//       console.log(err)
//     })
//     })
//     })()
