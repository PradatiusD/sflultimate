import GraphqlClient from '../../../lib/server-graphql-client'
import { gql } from '@apollo/client'
import QRCode from 'qrcode'
import { addLeagueToVariables } from '../../../lib/utils'
import { buildStatEditorUrl } from '../../../lib/stat-editor-utils'
import SeoHead from '../../../components/SeoHead'
import StatEditor from '../../../components/StatEditor'

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
          homeTeamScore
          awayTeamScore
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
          image {
            publicUrl
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

  const protocol = (context.req.headers['x-forwarded-proto'] || 'http').split(',')[0]
  const origin = `${protocol}://${context.req.headers.host}`
  await Promise.all(games.flatMap(game => game.teams.map(async team => {
    team.editorPath = buildStatEditorUrl(game.id, team.currentTeam.id)
    team.qrCode = await QRCode.toDataURL(origin + team.editorPath, { margin: 1, width: 180 })
  })))

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

  return <>
    <SeoHead
      title={`${props.league.title} Sheets`}
      description={`${props.league.title} stat sheets.`}
      path={url.split('?')[0]}
      noindex
      image={false}
    >
      <link rel='stylesheet' href='/styles/site.css' media='all'/>

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
        font-family: "Barlow Condensed", sans-serif;
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

      .stat-sheet-body {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 220px;
        gap: 12px;
        align-items: start;
      }

      .stat-sheet-rules { font-size: 12px; line-height: 1.35; }
      .stat-sheet-rules h2 { font-size: 16px; margin: 0 0 8px; }
      .stat-sheet-rules h3 { font-size: 13px; margin: 0 0 5px; }
      .stat-sheet-rules p { font-size: inherit; margin-bottom: 10px; }
      .stat-sheet-rules ul { padding-left: 16px; margin-bottom: 10px; }
      .stat-sheet-rules li { margin-bottom: 5px; }

      @media screen and (max-width: 767px) {
        .stat-sheet-body { grid-template-columns: minmax(0, 1fr); }
      }

      @media print {
        @page { size: letter portrait; margin: 0.35in; }
        .container-fluid { padding: 0; }
        .stat-page-container { margin-top: 0 !important; }
        .stat-sheet-body { grid-template-columns: minmax(0, 1fr) 195px; gap: 10px; }
        .stat-page-container .table { margin-bottom: 8px; }
        .stat-page-container td, .stat-page-container th {
          font-size: 10px;
          padding: 4px;
          line-height: 1.2;
          min-width: 0 !important;
        }
        .stat-page-container strong { white-space: normal; letter-spacing: 0; }
        .stat-page-container th { letter-spacing: 0; }
        .stat-editor-table tr, .stat-sheet-rules { break-inside: avoid; }
        .stat-sheet-rules { font-size: 10px; }
        .stat-sheet-rules h2 { font-size: 13px; }
        .stat-sheet-rules h3 { font-size: 11px; }
        .spirit-of-the-game-text { font-size: 9px; line-height: 1.3; margin-bottom: 0; }
      }

      @media all {
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
    </SeoHead>

    <div className="container-fluid">
      <div className="game-container">
        {!isTournament && games.map((game) => (
          game.teams.map((team) => (
            <section key={team.currentTeam.id} className="stat-page-container">
              <div className="d-flex align-items-center">
                {
                  team.currentTeam.image && team.currentTeam.image.publicUrl && (
                    <img className="d-inline" src={team.currentTeam.image.publicUrl} alt={team.currentTeam.name + ' logo'} style={{ height: '115px' }} />
                  )
                }
                <table className="table table-bordered table-striped">
                  <thead>
                  <tr>
                    <th style={{ minWidth: '90px' }}>Game Date</th>
                    <th style={{ minWidth: '140px' }}>Team</th>
                    <th style={{ maxWidth: '80px', minWidth: '80px' }}>Timeouts Used</th>
                    <th>1<sup>st</sup> Half Points</th>
                    <th>2<sup>nd</sup> Half Points</th>
                    <th style={{ maxWidth: '80px' }}>Most Spirited</th>
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
                <div className="text-center ms-2" style={{ width: '110px', flexShrink: 0 }}>
                  <img src={team.qrCode} alt={`QR code to enter ${team.currentTeam.name} stats`} style={{ width: '100px', height: '100px' }} />
                  <small style={{ display: 'block', lineHeight: 1.1 }}>Scan to enter stats</small>
                </div>
              </div>
              <div className="stat-sheet-body">
                <StatEditor
                  game={game}
                  team={team.currentTeam}
                  opponent={team.opponent}
                  isHomeTeam={game.homeTeam.id === team.currentTeam.id}
                  initialTeamScore={game.homeTeam.id === team.currentTeam.id ? game.homeTeamScore : game.awayTeamScore}
                  initialOpponentScore={game.homeTeam.id === team.currentTeam.id ? game.awayTeamScore : game.homeTeamScore}
                  initialStats={team.currentTeam.players.map(player => ({
                    player,
                    ...initPlayerMap[player.id][game.id]
                  }))}
                  editable={Boolean(editor)}
                />
                <aside className="stat-sheet-rules border rounded p-2" aria-label="League game rules">
                  <h2>Game rules</h2>
                  <h3>5 MMP - 2 FMP format</h3>
                  <ul>
                    <li>If a team does not have enough FMP’s to field 5/2, always be down a person.</li>
                    <li>6/1 if both captains agree (Captains Clause)</li>
                    <li>Gender match at time of pull</li>
                    <li>If no FMP’s present on both teams, 7v7 MMP’s is okay</li>
                  </ul>
                  <h3>Regular season</h3>
                  <p>Games to 11, half at 6</p>
                  <h3>Cap Rules</h3>
                  <ul>
                    <li>3pm game: 4:15 hard cap</li>
                    <li>4:30pm game: 5:45 hard cap</li>
                    <li><strong style={{ letterSpacing: '0px', textTransform: 'initial', whiteSpace: 'wrap' }}>At cap, finish the current point</strong>: When the hard cap (time limit) is reached, you don&apos;t stop immediately. Complete the point currently being played until someone scores.</li>
                    <li><strong style={{ letterSpacing: '0px', textTransform: 'initial', whiteSpace: 'wrap' }}>If it&apos;s tied after that point</strong>: Play one more &quot;universe point&quot; (next score wins).</li>
                    <li><strong style={{ letterSpacing: '0px', textTransform: 'initial', whiteSpace: 'wrap' }}>If it&apos;s not tied</strong>: The game is over immediately, and the team with more points wins.</li>
                    <li><strong style={{ letterSpacing: '0px', textTransform: 'initial', whiteSpace: 'wrap' }}>If the cap happens during halftime</strong>: The game ends on the spot—no second half is played—and whichever team is leading at halftime wins.</li>
                    <li>1 timeout per half, 1 floater</li>
                  </ul>

                  <p className="mb-0">Rotate pull FMP vs MMP</p>
                </aside>
              </div>

              <div>
                <SpiritOfTheGameText/>
                <label style={{ fontWeight: 'normal' }}>Please write here any spirit feedback you would like the
                  organizers to note:</label>
              </div>
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
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{new Date(today).toLocaleDateString()}</td>
                  <td><strong>{team.name}</strong> Scores</td>
                  <td style={{ minWidth: '175px' }}></td>
                  <td style={{ minWidth: '175px' }}></td>
                </tr>
                <tr>
                  <td>{team.game && new Date(team.game.scheduledTime).toLocaleTimeString()}</td>
                  <td>Opponent Scores</td>
                  <td></td>
                  <td></td>
                </tr>
                <tr>
                  <td></td>
                  <td>Timeouts Used</td>
                  <td></td>
                  <td></td>
                </tr>
                <tr>
                  <td></td>
                  <td>Spirit Scores (1-5, 1 bad, 5 great)</td>
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
              </tr>
              </thead>
              <tbody>
              {
                team.players.map((player) => {
                  return (
                    <tr key={player.firstName + player.lastName}>
                      <td>{player.firstName + '  ' + player.lastName.charAt(0).toUpperCase() + '.'}</td>
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
