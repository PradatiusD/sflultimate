import GraphqlClient from '../../lib/graphql-client'
import { gql } from '@apollo/client'
import Head from 'next/head'
import { HeaderNavigation } from '../../components/Navigation'
import { showDate, showHourMinute } from '../../lib/utils'
import Standings from '../../components/Standings'
import { PlayerLink } from '../../components/PlayerLink'
import GameStatTable from '../../components/GameStatTable'
import { updateWithGlobalServerSideProps } from '../../lib/global-server-side-props'
import { buildTeamUrl } from '../../lib/team-utils'
export const getServerSideProps = async (context) => {
  const results = await GraphqlClient.query({
    query: gql`
      query {
        currentGame: allGames(where: {id: "${context.params.game}"}) {
          id
          name
          scheduledTime
          league {
            id
            title
            slug
          }
          location {
            name
          }
          homeTeamScore
          homeTeam {
            id
            name
            slug
            players {
              id
              firstName
              lastName
              preferredPositions
            }
            image {
              publicUrl
            }
          }
          awayTeamScore
          awayTeam {
            id
            name
            slug
            players {
              id
              firstName
              lastName
              preferredPositions
            }
            image {
              publicUrl
            }
          }
        }
      }`
  })
  const game = results.data.currentGame[0]
  let playerIds = []
  const teamIds = []

  if (game.homeTeam && game.awayTeam) {
    game.awayTeam.score = game.awayTeamScore
    game.homeTeam.score = game.homeTeamScore
    playerIds = game.homeTeam.players.concat(game.awayTeam.players).map(player => player.id)
    teamIds.push(game.homeTeam.id, game.awayTeam.id)
  }

  const isGamePreview = new Date(game.scheduledTime).getTime() > Date.now()

  const statsQuery = {
    query: gql`
      query($playerIds: [ID!]!, $gameSearch: GameWhereInput) {
        allPlayerGameStats(where: {player: {id_in: $playerIds }, game: $gameSearch}) {
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
      playerIds,
      gameSearch: isGamePreview ? {} : { id: game.id }
    }
  }

  const statsResults = await GraphqlClient.query(statsQuery)
  const seasonResults = await GraphqlClient.query({
    query: gql`
      query($teamIds: [ID!]) {
        seasonGames: allGames(where: {league: {id: "${game.league.id}"}, OR: [{homeTeam: {id_in: $teamIds}}, {awayTeam: {id_in: $teamIds}}]}) {
          id
          homeTeam {
            id
            name
            slug
            image {
              publicUrl
            }
          }
          awayTeam {
            id
            name
            slug
            image {
              publicUrl
            }
          }
          homeTeamScore
          awayTeamScore
        }
      }
    `,
    variables: {
      teamIds
    }
  })
  const stats = statsResults.data.allPlayerGameStats

  const playerMap = {}
  for (const stat of stats) {
    playerMap[stat.player.id] = stat
  }

  let teams = []
  if (game.homeTeam && game.awayTeam) {
    teams.push(game.homeTeam, game.awayTeam)
  }

  teams = teams.map(function (team) {
    const newTeam = Object.assign({}, team)
    newTeam.stats = []
    team.players.forEach(player => {
      const stat = playerMap[player.id]
      if (stat) {
        const newStat = {
          player,
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

  const props = {
    game,
    games: seasonResults.data.seasonGames,
    teams,
    isGamePreview
  }

  await updateWithGlobalServerSideProps(props, context)
  return {
    props
  }
}

export default function GamePage (props) {
  const { game, teams, leagues, isGamePreview, games } = props
  let title, seoDescriptionSuffix
  if (game.homeTeam && game.awayTeam) {
    title = `${game.league.title} Matchup: ${game.homeTeam.name} vs ${game.awayTeam.name}`
    seoDescriptionSuffix = teams[0].name + ' vs ' + teams[1].name + ' - ' + showDate(game.scheduledTime)
  } else {
    title = `${game.league.title} ${game.name}`
    seoDescriptionSuffix = `${game.league.title} ${game.name}`
  }
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta property="og:title" content={title} />
        <meta property="og:url" content={'https://www.sflultimate.com/game/' + game._id} />
        <meta property="og:description" content={(isGamePreview ? 'Game Preview' : 'Game Recap') + ': ' + seoDescriptionSuffix } />
      </Head>
      <HeaderNavigation leagues={leagues} />
      <div className="container">
        {isGamePreview
          ? (
            <p className="h1 text-center">Preview</p>
            )
          : (
            <p className="h1 text-center">Recap</p>
            )}
        <p className="lead text-center">
          <strong>{game.league.title}</strong>
          {
            game.name && <><br/><strong>{game.name}</strong></>
          }
          <br/> {showDate(game.scheduledTime)} - {showHourMinute(game.scheduledTime)}
          <br/> {game.location ? game.location.name : ''}
        </p>
        <div className="row">
          <p className="h3 text-center">Season Standings</p>
          <Standings
            games={games}
            league={game.league}
            teamsFilter={(team) => {
              return team.id === game.homeTeam.id || team.id === game.awayTeam.id
            }}
          />

          {
            teams.map(function (team, index) {
              const positionMap = {}
              team.players.forEach(player => {
                player?.preferredPositions?.split(', ').forEach(position => {
                  if (position) {
                    positionMap[position] = positionMap[position] || 0
                    positionMap[position]++
                  }
                })
              })
              return (
                <div className="col-sm-6" key={index}>
                  <div className="text-center">
                    {!isGamePreview && <p className="h1">{team.score}</p>}
                    {
                      team.image && team.image.publicUrl && (
                        <div style={{ maxWidth: '400px', margin: '0 auto' }}>
                          <a href={buildTeamUrl(game.league, team)}>
                            <img src={team.image.publicUrl} className="img-fluid rounded" alt={team.name} style={{ maxWidth: '100%', objectFit: 'contain' }}/>
                          </a>
                        </div>
                      )
                    }
                    {
                      (!team.image || !team.image.publicUrl) && (
                        <h2><a href={buildTeamUrl(game.league, team)}>{team.name}</a></h2>
                      )
                    }
                    {
                      team.image && team.image.publicUrl && (
                        <h2 className="mt-3"><a href={buildTeamUrl(game.league, team)}>{team.name}</a></h2>
                      )
                    }

                    {
                      Object.keys(positionMap).length > 0 && (
                        <p className="lead d-flex justify-content-around">
                          <span>Player Positions:</span>
                          {
                            Object.keys(positionMap).sort().map(position => <span key={position}><strong style={{ fontWeight: 'bold' }}>{position.charAt(0).toUpperCase() + position.slice(1)}</strong>: {positionMap[position]}</span>)
                          }
                        </p>
                      )
                    }
                  </div>
                  {isGamePreview
                    ? (
                      <>
                        <p><em>Note: Below are season-wide stats.</em></p>
                        <GameStatTable team={team} isGamePreview={isGamePreview} />
                      </>
                      )
                    : (
                      <>
                        {
                          team.stats.length > 0 && (
                            <>
                              <h3>Attended</h3>
                              <GameStatTable team={team} isGamePreview={isGamePreview} />
                            </>
                          )
                        }
                        <h3>{team.stats.length > 0 ? 'Missing' : 'Stats Pending'}</h3>
                        <table className="table table-striped">
                          <thead>
                            <tr>
                              <th>Name</th>
                            </tr>
                          </thead>
                          <tbody>
                            {team.stats?.filter(stat => !stat.attended).map((stat, index) => (
                              <tr key={index}>
                                <td><PlayerLink player={stat.player} /></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </>
                      )
                  }
                </div>
              )
            })
          }
        </div>
      </div>
    </>
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
