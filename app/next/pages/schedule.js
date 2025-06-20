import Head from 'next/head'
import { gql } from '@apollo/client'
import GraphqlClient from '../lib/graphql-client'
import { HeaderNavigation } from '../components/Navigation'
import { showDate, showHourMinute } from '../lib/utils'
import { useState } from 'react'
import LeagueUtils from '../lib/league-utils'

export const getServerSideProps = async () => {
  const results = await GraphqlClient.query({
    query: gql`
      query {
        allLeagues(where: {isActive: true}) {
          id
          title
          earlyRegistrationStart
          earlyRegistrationEnd
          registrationStart
          registrationEnd
          lateRegistrationStart
          lateRegistrationEnd
          finalsTournamentDescription
          finalsTournamentEndDate
          finalsTournamentStartDate
          finalsTournamentLocation {
            name
          }
        }
        allGames(where: {league: {isActive: true}}, sortBy: scheduledTime_ASC) {
          id
          scheduledTime
          homeTeam {
            name
            color
          }
          homeTeamScore
          homeTeamForfeit
          awayTeam {
            name
            color
          }
          awayTeamScore
          awayTeamForfeit
          location {
            name
          }
          __typename
        }
        allEvents {
          id
          startTime
          name
          location
          moreInformationUrl
          __typename
        }
        allTeams(where: {league: {isActive: true}}) {
          id
          color
        }
      }`
  })
  const league = results.data.allLeagues[0]
  const games = Array.from(results.data.allGames).sort((a, b) => {
    return new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime()
  })
  const teams = results.data.allTeams
  const events = results.data.allEvents.filter(event => event.startTime && new Date(event.startTime).getTime() > Date.now())
  LeagueUtils.addLeagueStatus(league)
  return { props: { league, games, teams, events } }
}

export default function Schedule (props) {
  const { league, games, teams, events } = props

  const finalsStartDate = new Date(league.finalsTournamentStartDate)

  const gamesAndEvents = games.concat(events)
  gamesAndEvents.sort((a, b) => {
    return new Date(a.startTime || a.scheduledTime).getTime() - new Date(b.startTime || b.scheduledTime).getTime()
  })
  const [activeGames, setactiveGames] = useState(gamesAndEvents)

  return (
    <>
      <Head>
        <title>{league.title + ' Schedule'}</title>
        <meta property="og:title" content={`${league.title} Schedule`} />
        <meta property="og:url" content="https://www.sflultimate.com/schedule" />
        <meta property="og:description" content={'Discover the games schedule for ' + league.title} />
        <meta property="og:image" content="https://www.sflultimate.com/images/open-graph/schedule.jpg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
      </Head>
      <HeaderNavigation league={league} />
      <div className="container">
        <div className="schedule">
          <section>
            <h1>{league.title} Schedule</h1>
            <p className="lead">
              Pick your color to filter schedule by your team.<br/>
              {
                teams.map(team => {
                  return (
                    <span
                      className="team-color"
                      key={team.id}
                      style={{ backgroundColor: team.color }}
                      onClick={() => {
                        const filteredList = games.filter((game) => {
                          return game.homeTeam.color === team.color || game.awayTeam.color === team.color
                        })
                        setactiveGames(filteredList)
                      }}
                    ></span>
                  )
                })
              }

            </p>
            <table className="table table-striped table-bordered">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Matchup / Event Name</th>
                  <th>Field</th>
                  <th>Preview/Recap</th>
                </tr>
              </thead>
              <tbody>
                {
                  activeGames.map((gameOrEvent) => {
                    if (gameOrEvent.__typename === 'Game') {
                      const inPast = new Date(gameOrEvent.scheduledTime).getTime() < Date.now()
                      return (
                        <tr key={gameOrEvent.id} className={inPast ? 'text-muted' : ''}>
                          {

                          }
                          <td>{showDate(gameOrEvent.scheduledTime)}</td>
                          <td>{showHourMinute(gameOrEvent.scheduledTime)}</td>
                          <td>
                            <span><span
                              style={{ borderBottom: '3px solid ' + gameOrEvent.homeTeam.color }}>{gameOrEvent.homeTeam.name}</span> vs. <span
                              style={{ borderBottom: '3px solid ' + gameOrEvent.awayTeam.color }}>{gameOrEvent.awayTeam.name}</span></span>
                            {
                              (gameOrEvent.homeTeamScore > 0 || gameOrEvent.awayTeamScore > 0) && (!gameOrEvent.homeTeamForfeit && !gameOrEvent.homeTeamForfeit) && (
                                <span> ({gameOrEvent.homeTeamScore}-{gameOrEvent.awayTeamScore})</span>
                              )
                            }
                            {
                              gameOrEvent.homeTeamForfeit && (
                                <span>
                                  <br/> {gameOrEvent.homeTeam.name} forfeited
                                </span>
                              )
                            }
                            {
                              gameOrEvent.awayTeamForfeit && (
                                <span>
                                  <br/> {gameOrEvent.awayTeam.name} forfeited
                                </span>
                              )
                            }
                          </td>
                          <td>{gameOrEvent?.location?.name}</td>
                          <td>
                            <a href={'/games/' + gameOrEvent.id}>
                              {new Date(gameOrEvent.scheduledTime).getTime() < Date.now() ? 'Recap' : 'Preview'}
                            </a>
                          </td>
                        </tr>
                      )
                    }
                    return (
                      <tr key={gameOrEvent.id}>
                        <td>{showDate(gameOrEvent.startTime)}</td>
                        <td>{showHourMinute(gameOrEvent.startTime)}</td>
                        <td><span className="badge">Event</span> {gameOrEvent.name}</td>
                        <td>{gameOrEvent.location}</td>
                        <td><a target="_blank" href={gameOrEvent.moreInformationUrl}>More Information</a></td>
                      </tr>
                    )
                  })
                }
                <tr>
                  <td>{showDate(finalsStartDate)}</td>
                  <td>{showHourMinute(finalsStartDate)} - {showHourMinute(league.finalsTournamentEndDate)}</td>
                  <td style={{ maxWidth: '529px' }} dangerouslySetInnerHTML={{__html: league.finalsTournamentDescription }}></td>
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
