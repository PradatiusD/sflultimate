import GraphqlClient from '../../../lib/graphql-client'
import { gql } from '@apollo/client'
import { useState } from 'react'
import { addLeagueToVariables } from '../../../lib/utils'

export async function getServerSideProps (context) {
  const variables = addLeagueToVariables(context, {})
  const results = await GraphqlClient.query({
    query: gql`
      query($leagueCriteria: LeagueWhereInput) {
        allLeagues(where:$leagueCriteria) {
          title
        }
        allGames(where: {league: $leagueCriteria}, sortBy: scheduledTime_ASC) {
          id
          scheduledTime
          homeTeam {
            id
            name
          },
          awayTeam {
            id
            name
          }
        }
        allTeams(where: {league: $leagueCriteria}) {
          id
          name
          color
          captains {
            id
            gender
            firstName
            lastName
          }
          players(sortBy: [gender_ASC, firstName_ASC, lastName_ASC]) {
            id
            gender
            firstName
            lastName
          }
        }
      }`,
    variables
  })
  const league = results.data.allLeagues[0]
  const teams = results.data.allTeams
  let games = results.data.allGames.filter(function (item) {
    return !!(item.homeTeam && item.awayTeam)
  }).map(function (game) {
    const g = Object.assign({}, game)
    const awayTeam = teams.find((team) => team.id === game.awayTeam.id)
    const homeTeam = teams.find((team) => team.id === game.homeTeam.id)
    g.teams = [
      {
        currentTeam: homeTeam,
        opponent: awayTeam
      },
      {
        currentTeam: awayTeam,
        opponent: homeTeam
      }
    ]
    return g
  })

  if (context.query.date) {
    const forcedDate = context.query.date
    games = games.filter(function (game) {
      return new Date(game.scheduledTime).toLocaleDateString('en-CA', { timeZone: 'America/New_York' }) === forcedDate
    })
  } else {
    const now = Date.now()
    games = games.filter(function (game) {
      const gameTime = new Date(game.scheduledTime).getTime()
      return now <= gameTime && gameTime <= now + 13 * 24 * 60 * 60 * 1000
    })
  }

  const initPlayerMap = {}
  const statResults = await GraphqlClient.query({
    query: gql`
      query($gameIDs: [ID!]) {
        allPlayerGameStats(where: {game: {id_in: $gameIDs}}) {
          id
          player {
            id
          }
          game {
            id
          }
          scores
          assists
          defenses
          attended
        }
      }
    `,
    variables: {
      gameIDs: games.map(game => game.id)
    }
  })

  statResults.data.allPlayerGameStats?.forEach(function (playerGameStats) {
    if (!initPlayerMap[playerGameStats.player.id]) {
      initPlayerMap[playerGameStats.player.id] = {}
    }
    if (!initPlayerMap[playerGameStats.player.id][playerGameStats.game.id]) {
      initPlayerMap[playerGameStats.player.id][playerGameStats.game.id] = {
        gameStatId: playerGameStats.id,
        assists: playerGameStats.assists,
        scores: playerGameStats.scores,
        defenses: playerGameStats.defenses,
        attended: playerGameStats.attended || false
      }
    }
  })

  // team to games map
  const teamsToGamesMap = {}
  games.forEach(function (game) {
    [game.awayTeam.id, game.homeTeam.id].forEach(team => {
      if (!teamsToGamesMap[team]) {
        teamsToGamesMap[team] = []
      }
      teamsToGamesMap[team].push(game.id)
    })
  })

  teams.forEach(team => {
    team.players.forEach(player => {
      if (!initPlayerMap[player.id]) {
        initPlayerMap[player.id] = {}
      }
      teamsToGamesMap[team.id]?.forEach(gameId => {
        if (!initPlayerMap[player.id][gameId]) {
          initPlayerMap[player.id][gameId] = {
            assists: 0,
            scores: 0,
            defenses: 0,
            attended: false
          }
        }
      })
    })
  })

  return {
    props: {
      league,
      teams,
      games,
      queryParams: context.req.query,
      initPlayerMap,
      url: context.req.url
    }
  }
}

function SpiritOfTheGameText () {
  return <>
    <p className="spirit-of-the-game-text">
      <em><strong>What is Spirit of the Game?</strong> A truly unique and defining element of ultimate, Spirit of the
        Game places the responsibility of fair play solely on the athletes themselves by requiring each player to know
        the rules and make their own calls, without the help of a neutral official. These underlying principles (mutual
        respect, conflict resolution, knowledge of the rules, body control, communication, and the joy of play)
        reinforce mutual respect and trust between opponents; communication and conflict resolution skills; and self
        confidence – both on and off the field of play.</em>
    </p>
  </>
}

function Sheets (props) {
  const { teams, games, queryParams, initPlayerMap, url } = props
  const editor = queryParams.editor
  const isTournament = url.indexOf('isTournament') !== -1
  const today = new Date()

  const handleSave = function (game, team) {
    function updateStatsForPlayer (player) {
      let mutation
      let params
      const stats = statsMap[player.id][game.id]
      const statId = stats && stats.gameStatId
      const statDataVariable = {
        player: {
          connect: {
            id: player.id
          }
        },
        game: {
          connect: {
            id: game.id
          }
        },
        assists: stats.assists,
        scores: stats.scores,
        defenses: stats.defenses,
        attended: stats.attended || false
      }
      if (statId) {
        mutation = gql`
          mutation updateStat($id: ID!, $data: PlayerGameStatUpdateInput) {
            updatePlayerGameStat(id: $id, data: $data) {
              id
              player {
                id
              }
              game {
                id
              }
              assists
              scores
              defenses
              throwaways
              drops
              pointsPlayed
              attended
            }
          }
        `
        params = {
          mutation,
          variables: {
            id: statId,
            data: statDataVariable
          }
        }
      } else {
        mutation = gql`
          mutation createStat($data: PlayerGameStatCreateInput) {
            createPlayerGameStat(data: $data) {
              player {
                id
              }
              game {
                id
              }
              assists
              scores
              defenses
              throwaways
              drops
              pointsPlayed
              attended
            }
          }
        `
        params = {
          mutation,
          variables: {
            data: statDataVariable
          }
        }
      }

      return GraphqlClient.mutate(params)
    }

    Promise.all(team.players.map(function (player) {
      return updateStatsForPlayer(player)
    })).then(function (response) {
      const newState = { ...statsMap }
      response.forEach(function (player) {
        const response = (player.data.createPlayerGameStat || player.data.updatePlayerGameStat)
        const playerId = response.player.id
        newState[playerId][game.id] = {
          ...response,
          gameStatId: response.id
        }
      })
      setStatsMap(newState)
    }).then(function () {
      alert('Your data was saved for ' + team.name + ' for the game at ' + new Date(game.scheduledTime).toLocaleString())
    }).catch(function () {
      alert('There was an error saving for ' + team.name)
    })
  }
  const [statsMap, setStatsMap] = useState(initPlayerMap)

  return <>
    <link rel='stylesheet' href='/styles/site.css' media='all'/>
    <link rel="preconnect" href="https://fonts.googleapis.com"/>
    <link
      href="https://fonts.googleapis.com/css2?family=Roboto+Condensed:ital,wght@0,300;0,400;0,700;1,300;1,400;1,700&family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&display=swap"
      rel="stylesheet"/>
    <style>{
      `
      .spirit-of-the-game-text {
        font-size: 0.7em;
      }

      td, th, p, label {
        font-size: 0.8em;
      }

      th {
        letter-spacing: 1px;
      }

      th {
        font-weight: 800;
        font-family: "Roboto Condensed", sans-serif;
        text-transform: uppercase;
        background: #e9e9e9;
      }

      .table-bordered, .table-bordered td, .table-bordered th {
        border: 1px solid #989898 !important;
      }

      .logo {
        max-height: 400px;
        float: right;
        margin-top: 1em;
      }

      strong {
        font-weight: 800;
        letter-spacing: 2px;
        text-transform: uppercase;
        white-space: nowrap;
      }

      @media all {
        @page {
          size: auto;
          margin: 1em;
        }
        .game-container:first-child .stat-page-container:first-child {
            page-break-before: initial;
        }

        .stat-page-container {
          page-break-before: always;
          page-break-after: always;
          margin-top: 20px;
        }

        .game-container:last-child .stat-page-container:last-child {
          page-break-after: initial;
        }
      }`}
    </style>

    <div className="container-fluid">
      <div className="game-container">
        {!isTournament && games.map((game) => (
          game.teams.map((team) => (
            <section key={team.currentTeam.id} className="stat-page-container">
              <table className="table table-bordered table-striped">
                <thead>
                  <tr>
                    <th style={{ minWidth: '90px' }}>Game Date</th>
                    <th style={{ minWidth: '140px' }}>Team</th>
                    <th style={{ minWidth: '130px' }}>Time-Outs Used</th>
                    <th>1<sup>st</sup> Half Points</th>
                    <th>2<sup>nd</sup> Half Points</th>
                    <th>Most Spirited</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{new Date(game.scheduledTime).toLocaleDateString()}</td>
                    <td><strong>{team.currentTeam.name}</strong></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                  </tr>
                  <tr>
                    <td>{new Date(game.scheduledTime).toLocaleTimeString()}</td>
                    <td>{team.opponent.name}</td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                  </tr>
                </tbody>
              </table>

              <table className="table table-bordered table-striped">
                <thead>
                  <tr>
                    <th>Player Name</th>
                    <th>Attended</th>
                    <th>Assists</th>
                    <th>Scores</th>
                    <th>Defenses</th>
                    <th className="hidden">Throwaways</th>
                    <th className="hidden">Drops</th>
                  </tr>
                </thead>
                <tbody>
                  {
                    team.currentTeam.players.map((player) => {
                      const stats = statsMap[player.id][game.id] || {}
                      const onChange = function (str) {
                        return (e) => {
                          const newStats = { ...stats }
                          newStats[str] = str === 'attended' ? e.target.checked : parseInt(e.target.value) || 0
                          const newStatsMap = { ...statsMap }
                          newStatsMap[player.id][game.id] = newStats
                          setStatsMap(newStatsMap)
                        }
                      }

                      const inputProps = {
                        disabled: !editor,
                        style: {}
                      }
                      if (new Date(game.scheduledTime).getTime() > Date.now()) {
                        inputProps.style.display = 'none'
                      }

                      const textInputProps = {
                        min: 0,
                        step: 1,
                        type: 'number',
                        ...inputProps
                      }
                      return (
                        <tr key={player.firstName + player.lastName}>
                          <td style={{ width: '20%' }}>{player.firstName} {player.lastName}</td>
                          <td style={{ width: '76px' }}><input type="checkbox" {...inputProps} checked={stats.attended} onChange={onChange('attended')} /></td>
                          <td>
                            <input {...textInputProps} value={stats.assists} onChange={onChange('assists')}/>
                          </td>
                          <td><input {...textInputProps} value={stats.scores} onChange={onChange('scores')} /></td>
                          <td><input {...textInputProps} value={stats.defenses} onChange={onChange('defenses')} /></td>
                          <td className="hidden"><input type="number" min="0" step="1" disabled={!editor}/></td>
                          <td className="hidden"><input type="number" min="0" step="1" disabled={!editor}/></td>
                        </tr>
                      )
                    })
                  }
                </tbody>
              </table>

              <div className="form-group">
                <label style={{ fontWeight: 'normal' }}>Please write here any spirit feedback you would like the
                    organizers to note:</label>
                <textarea className="form-control" style={{ marginBottom: '10px' }} rows={1}></textarea>
              </div>
              {editor && (
                <button className="btn btn-primary" onClick={() => handleSave(game, team.currentTeam)}>
                    Save {team.currentTeam.name}'s stats for {new Date(game.scheduledTime).toLocaleDateString()}
                </button>
              )}
              <SpiritOfTheGameText/>
            </section>
          )
          )))}

        {isTournament && teams.map((team) => (
          <section key={team.name} className="stat-page-container">
            <table className="table table-bordered table-striped">
              <thead>
                <tr>
                  <th>Game Date</th>
                  <th>Team</th>
                  <th className="text-center">Game 1</th>
                  <th className="text-center">Game 2</th>
                  <th className="text-center">Game 3</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{new Date(today).toLocaleDateString()}</td>
                  <td><strong>{team.name}</strong> Scores</td>
                  <td style={{ minWidth: '175px' }}></td>
                  <td style={{ minWidth: '175px' }}></td>
                  <td style={{ minWidth: '175px' }}></td>
                </tr>
                <tr>
                  <td>{team.game && new Date(team.game.scheduledTime).toLocaleTimeString()}</td>
                  <td>Opponent Scores</td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
                <tr>
                  <td></td>
                  <td>Timeouts Used</td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
                <tr>
                  <td></td>
                  <td>Spirit Scores (1-5, 1 bad, 5 great)</td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
              </tbody>
            </table>
            <table className="table table-bordered table-striped">
              <thead>
              <tr>
                <th>Player Name</th>
                <th>Attended</th>
                <th>G1 Assists</th>
                <th>G1 Scores</th>
                <th>G1 Defenses</th>
                <th>G2 Assists</th>
                <th>G2 Scores</th>
                <th>G2 Defenses</th>
                <th>G3 Assists</th>
                <th>G3 Scores</th>
                <th>G3 Defenses</th>
              </tr>
              </thead>
              <tbody>
              {
                team.players.map((player) => {
                  return (
                    <tr key={player.firstName + player.lastName}>
                      <td>{player.firstName + ' ' + player.lastName}</td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                    </tr>
                  )
                })
              }
              </tbody>
            </table>
            <SpiritOfTheGameText/>
          </section>
        ))}
      </div>
    </div>
  </>
}

export default Sheets
//     (function () {
//         // http://localhost:5000/sheets?is_tournament=true
//         // http://localhost:5000/sheets?date=2022-10-11
//         // http://localhost:5000/sheets?date=2022-10-11&editor=true
//
//         const urlParams = new URLSearchParams(window.location.search)
//         $scope.isTournament = urlParams.get('is_tournament')
//         const forcedDate = urlParams.get('date')
//         $scope.today = forcedDate ? new Date(urlParams.get('date') + 'T12:00:00.000Z') : new Date()
//         $scope.editor = urlParams.get('editor')
//
//         let teamsResponse
//         let statsResponse
//         $http.get(window.sflUtils.addLeagueOverride('/teams?f=json'))
//           .then(function (response) {
//             teamsResponse = response
//             return $http.get(window.sflUtils.addLeagueOverride('/stats?f=json&raw=true'))
//           }).then(function (response) {
//           statsResponse = response
//         }).then(function (response) {
//           const teamsData = teamsResponse.data
//           const teams = teamsData.teams
//
//           const statsMap = {}
//           statsResponse.data.items.forEach(function (statEntry) {
//             if (validGameIDs.indexOf(statEntry.game) > -1) {
//               statsMap[statEntry.player] = statEntry
//             }
//           })
//
//           teamsData.players.forEach(function (player) {
//             player.stats = statsMap[player._id] || {
//               pointsPlayed: 0,
//               defenses: 0,
//               scores: 0,
//               assists: 0,
//               attended: false
//             }
//             playerMap[player._id] = player
//           })
//
//           const teamMap = {}
//           teams.forEach(function (team) {
//             teamMap[team._id] = team
//             team.players = team.players.map(function (playerId) {
//               return playerMap[playerId]
//             })
//           })
//

//         })
//       })
//     })()
