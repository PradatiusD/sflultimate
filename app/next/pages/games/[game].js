import GraphqlClient from '../../lib/graphql-client'
import { gql } from '@apollo/client'
import Head from 'next/head'
import { HeaderNavigation } from '../../components/Navigation'
import { addLeagueStatus } from '../../lib/payment-utils'
import { showDate, showHourMinute } from '../../lib/utils'
import Standings from '../../components/Standings'
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
        allPlayerGameStats(where: {game: {id: "${context.params.game}"}}) {
          id
          defenses
          scores
          assists
          attended
          player {
            id
          }
        }
      }`
  })
  const game = results.data.currentGame[0]

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

  const stats = results.data.allPlayerGameStats

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
      isGamePreview: stats.length === 0
    }
  }
}

export default function GamePage (props) {
  const { game, preview, teams, league, isGamePreview, games } = props
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
        {preview ? (
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
                {!preview && <p className="h1">{team.score}</p>}
                <h2>{team.name}</h2>
              </div>
              {preview ? (
                <>
                  <p><em>Note: Below are season-wide stats.</em></p>
                  <GameStatTable team={team} />
                </>
              ) : (
                <>
                  <h3>Attended</h3>
                  <GameStatTable team={team} />
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
                          <td>{stat.player.firstName} {stat.player.lastName}</td>
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
  const { team } = props
  return (
    <table className="table table-striped">
      <thead>
        <tr>
          <th>Name</th>
          <th>Assists</th>
          <th>Scores</th>
          <th>Defenses</th>
          <th>Throwaways</th>
          <th>Drops</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        {team.stats?.map((stat, index) => (
          <tr key={index}>
            <td>{stat.player.firstName} {stat.player.lastName}</td>
            <td>{stat.assists}</td>
            <td>{stat.scores}</td>
            <td>{stat.defenses}</td>
            <td>{stat.throwaways}</td>
            <td>{stat.drops}</td>
            <td>{stat.total}</td>
          </tr>
        ))}
      </tbody>
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
