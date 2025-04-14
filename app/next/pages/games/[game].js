import GraphqlClient from '../../lib/graphql-client'
import { gql } from '@apollo/client'
import Head from 'next/head'
import { HeaderNavigation } from '../../components/Navigation'
import { addLeagueStatus } from '../../lib/payment-utils'
import { showDate, showHourMinute } from '../../lib/utils'
import Standings from '../../components/Standings'
import {buildPlayerUrl} from "../../components/PlayerLink";
export const getServerSideProps = async (context) => {
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
        },
        currentGame: allGames(where: {id: "${context.params.game}"}) {
          scheduledTime
          league {
            id
            title
          }
          location {
            name
          }
          homeTeamScore
          homeTeam {
            id
            name
            players {
              id
              firstName
              lastName
            }
          }
          awayTeamScore
          awayTeam {
            id
            name
            players {
              id
              firstName
              lastName
            }
          }
        }
      }`
  })

  const statsResults = await GraphqlClient.query({
    query: gql`
        query($playerIds: [ID!]!) {
          allPlayerGameStats(where: {player: {id_in: $playerIds }}) {
            id
            defenses
            scores
            assists
            attended
            player {
              id
            }
            game {
              id
            }
          }
        }
    `,
    variables: {
      playerIds: results.data.currentGame[0].homeTeam.players.concat(results.data.currentGame[0].awayTeam.players).map(player => player.id)
    }
  })

  const game = results.data.currentGame[0]
  game.awayTeam.score = game.awayTeamScore
  game.homeTeam.score = game.homeTeamScore

  const teamIds = [game.homeTeam.id, game.awayTeam.id]
  const seasonResults = await GraphqlClient.query({
    query: gql`
      query($teamIds: [ID!]) {
        seasonGames: allGames(where: {league: {id: "${game.league.id}"}, OR: [{homeTeam: {id_in: $teamIds}}, {awayTeam: {id_in: $teamIds}}]}) {
          id
          homeTeam {
            id
            name
          }
          awayTeam {
            id
            name
          }
          homeTeamScore
          awayTeamScore
        }
      }
    `,
    variables: {
      teamIds: teamIds
    }
  })

  const league = JSON.parse(JSON.stringify(results.data.allLeagues[0]))
  addLeagueStatus(league)

  const stats = statsResults.data.allPlayerGameStats

  const playerMap = {}
  for (const stat of stats) {
    playerMap[stat.player.id] = stat
  }


  const teams = [game.homeTeam, game.awayTeam].map(function (team) {
    const newTeam = Object.assign({}, team)
    newTeam.stats = []
    team.players.forEach(player => {
      const stat = playerMap[player.id]
      if (stat) {
        const newStat = {
          player: player,
          assists: stat.assists || 0,
          scores: stat.scores || 0,
          defenses: stat.defenses || 0,
          throwaways: stat.throwaways || 0,
          drops: stat.drops || 0,
          attended: stat.attended || false
        }
        newStat.total = newStat.assists + newStat.scores + newStat.defenses
        if (newStat.total > 0 && stat.attended === false) {
          newStat.attended = true
        }
        newTeam.stats.push(newStat)
      }
    })

    newTeam.stats.sort((a, b) => {
      return b.total - a.total
    })

    return newTeam
  })

  return {
    props: {
      league,
      game: game,
      games: seasonResults.data.seasonGames,
      teams: teams,
      isGamePreview: new Date(game.scheduledTime).getTime() > Date.now()
    }
  }
}

export default function GamePage (props) {
  const { game, teams, league, isGamePreview, games } = props
  const title = game.league.title + ' ' + 'Matchup: ' + game.homeTeam.name + ' vs ' + game.awayTeam.name
  const seoDescriptionSuffix = teams[0].name + ' vs ' + teams[1].name + ' - ' + showDate(game.scheduledTime)
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta property="og:title" content={title} />
        <meta property="og:url" content={'https://www.sflultimate.com/game/' + game._id} />
        <meta property="og:description" content={(isGamePreview ? 'Game Preview' : 'Game Recap') + ': ' + seoDescriptionSuffix } />
      </Head>
      <HeaderNavigation league={league} />
      <div className="container">
        {isGamePreview ? (
          <p className="h1 text-center">Preview</p>
        ) : (
          <p className="h1 text-center">Recap</p>
        )}
        <p className="lead text-center">
          <strong>{game.league.title}</strong>
          <br/> {showDate(game.scheduledTime)} - {showHourMinute(game.scheduledTime)}
          <br/> {game.location ? game.location.name : ''}
        </p>
        <div className="row">
          <p className="h3 text-center">Season Standings</p>
          <Standings
            games={games}
            teamsFilter={(team) => {
              return team.id === game.homeTeam.id || team.id === game.awayTeam.id
            }}
          />

          {teams.map((team, index) => (
            <div className="col-sm-6" key={index}>
              <div className="text-center">
                {!isGamePreview && <p className="h1">{team.score}</p>}
                <h2>{team.name}</h2>
              </div>
              {isGamePreview ? (
                <>
                  <p><em>Note: Below are season-wide stats.</em></p>
                  <GameStatTable team={team} isGamePreview={isGamePreview} />
                </>
              ) : (
                <>
                  <h3>Attended</h3>
                  <GameStatTable team={team} isGamePreview={isGamePreview} />
                  <h3>Missing</h3>
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>Name</th>
                      </tr>
                    </thead>
                    <tbody>
                      {team.stats?.filter(stat => !stat.attended).map((stat, index) => (
                        <tr key={index}>
                          <td><a href={buildPlayerUrl(stat.player)}>{stat.player.firstName} {stat.player.lastName}</a></td>
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

function GameStatTable (props) {
  const { team, isGamePreview } = props
  return (
    <table className="table table-striped">
      <thead>
        <tr>
          <th>Name</th>
          <th>Assists</th>
          <th>Scores</th>
          <th>Defenses</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        {team.stats.length > 0 && team.stats.filter(s => isGamePreview ? true : s.attended || s.total > 0).map((stat, index) => (
          <tr key={index}>
            <td><a href={buildPlayerUrl(stat.player)}>{stat.player.firstName} {stat.player.lastName}</a></td>
            <td>{stat.assists}</td>
            <td>{stat.scores}</td>
            <td>{stat.defenses}</td>
            <td>{stat.total}</td>
          </tr>
        ))}
        {team.stats.length === 0 && team.players.map((player, index) => (
          <tr key={index}>
            <td><a href={buildPlayerUrl(player)}>{player.firstName} {player.lastName}</a></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr>
          <th>Total</th>
          <th>{team.stats.reduce((a, s) => a + s.assists, 0)}</th>
          <th>{team.stats.reduce((a, s) => a + s.scores, 0)}</th>
          <th>{team.stats.reduce((a, s) => a + s.defenses, 0)}</th>
          <th>{team.stats.reduce((a, s) => a + s.total, 0)}</th>
        </tr>
      </tfoot>
    </table>
  )
}

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
