import GraphqlClient from '../../lib/graphql-client'
import { gql } from '@apollo/client'
import { useEffect, useState } from 'react'
import { HeaderNavigation } from '../../components/Navigation'
import { getMongoTimestamp } from '../../lib/utils'
import { buildPlayerUrl } from '../../components/PlayerLink'
import { PreferredPositionBadge, getPreferredPositions } from '../../components/PreferredPositions'
import { updateWithGlobalServerSideProps } from '../../lib/global-server-side-props'
import { buildTeamUrl } from '../../lib/team-utils'
import SeoHead from '../../components/SeoHead'

const statKeys = ['assists', 'scores', 'defenses']

function buildLeagueStatsUrl (league) {
  return `/leagues/${league.slug}/stats`
}

function getLeagueYearLabel (league) {
  const yearMatch = league?.title?.match(/\b(20\d{2})\b/)
  if (yearMatch) {
    return yearMatch[1]
  }

  return getMongoTimestamp(league.id).getFullYear()
}

function sortPlayersByName (players = []) {
  return Array.from(players).sort(function (a, b) {
    const aName = `${a.firstName} ${a.lastName}`.trim().toLowerCase()
    const bName = `${b.firstName} ${b.lastName}`.trim().toLowerCase()
    return aName.localeCompare(bName)
  })
}

function getMostRecentPlayerRecord (players = []) {
  return Array.from(players).sort(function (a, b) {
    return getMongoTimestamp(b.id) - getMongoTimestamp(a.id)
  })[0]
}

function getCanonicalPlayer (players = []) {
  const playersWithImages = players.filter(function (player) {
    return player.profileImage?.publicUrl
  })

  if (playersWithImages.length > 0) {
    return getMostRecentPlayerRecord(playersWithImages)
  }

  return getMostRecentPlayerRecord(players)
}

function WinLossRecord (props) {
  const { wins, losses } = props
  return (
    <strong>
      <span style={{ color: '#198754' }}>{wins}W</span>
      <span>-</span>
      <span style={{ color: '#dc3545' }}>{losses}L</span>
    </strong>
  )
}

const seasonStatCards = [
  {
    key: 'leagues',
    label: 'Leagues',
    singularLabel: 'League',
    icon: 'fa-solid fa-trophy'
  },
  {
    key: 'scores',
    label: 'Scores',
    singularLabel: 'Score',
    icon: 'fa-solid fa-bullseye'
  },
  {
    key: 'assists',
    label: 'Assists',
    singularLabel: 'Assist',
    icon: 'fa-solid fa-handshake-angle'
  },
  {
    key: 'defenses',
    label: 'Defenses',
    singularLabel: 'Defense',
    icon: 'fa-solid fa-shield-halved'
  }
]

export const getServerSideProps = async (context) => {
  const nameSplit = context.query.player.split('-')
  const firstName = nameSplit[0]
  const lastName = nameSplit[nameSplit.length - 1]

  const playerResults = await GraphqlClient.query({
    query: gql`
      query ($firstName: String!, $lastName: String!) {
        allLeagues(where:{isActive: true}) {
          id
          title
          earlyRegistrationStart
          earlyRegistrationEnd
          registrationStart
          registrationEnd
          lateRegistrationStart
          lateRegistrationEnd
        }
        allPlayers(where: {firstName_contains_i: $firstName, lastName_contains_i: $lastName}) {
          id
          firstName
          lastName
          preferredPositions
          profileImage {
            publicUrl
          }
          leagues {
            id
            title
            slug
          }
        }
      }`,
    variables: {
      firstName,
      lastName
    }
  })

  const playerIds = playerResults.data.allPlayers.map(player => player.id)

  // Build League Array
  const leagueIdList = []
  const leagueGameStatHistory = playerResults.data.allPlayers.reduce(function (acc, player) {
    player.leagues.forEach(function (league) {
      if (!leagueIdList.includes(league.id)) {
        leagueIdList.push(league.id)

        acc.push(Object.assign({}, league))
      }
    })
    return acc
  }, []).sort(function (a, b) {
    return getMongoTimestamp(a.id) - getMongoTimestamp(b.id)
  })

  const gameResults = await GraphqlClient.query({
    query: gql`
      query($playerIds: [ID!], $leagueIds: [ID!]) {
        allPlayerGameStats (where:{player: {id_in: $playerIds}}) {
          assists
          scores
          defenses
          attended
          game {
            id
          }
        }
        allGames(where: {league: {id_in: $leagueIds}}) {
          id
          scheduledTime
          homeTeamScore
          awayTeamScore
          homeTeam {
            id
            name
            slug
          }
          awayTeam {
            id
            name
            slug
          }
        }
        allTeams(where: {players_some: {id_in: $playerIds}}) {
          id
          name
          slug
          image {
            publicUrl
          }
          league {
            id
            slug
          }
          captains {
            id
            firstName
            lastName
          }
          players {
            id
            firstName
            lastName
          }
        }
      }
    `,
    variables: {
      playerIds,
      leagueIds: leagueIdList
    }
  })

  const playerGameStats = gameResults.data.allPlayerGameStats
  const gameToStatsMap = {}
  for (const stat of playerGameStats) {
    if (stat.game) {
      gameToStatsMap[stat.game.id] = stat
    }
  }

  const allTimeTotals = {
    assists: 0,
    scores: 0,
    defenses: 0,
    leagues: leagueGameStatHistory.length
  }

  // Now add the team/games to the array of leagues
  leagueGameStatHistory.forEach(function (league) {
    const foundTeamForLeague = gameResults.data.allTeams.find(function (team) {
      return team.league.id === league.id
    })
    league.totals = {
      assists: 0,
      scores: 0,
      defenses: 0,
      overall: 0,
      playerTeamScore: 0,
      opponentTeamScore: 0,
      outcomes: [],
      wins: 0,
      losses: 0
    }
    league.highStats = {
      assists: 0,
      scores: 0,
      defenses: 0
    }
    if (foundTeamForLeague) {
      league.team = Object.assign({}, foundTeamForLeague)
      league.games = gameResults.data.allGames.reduce(function (acc, dbGame) {
        if (!dbGame.homeTeam || !dbGame.awayTeam) {
          return acc
        }
        const isHomeTeam = dbGame.homeTeam.id === league.team.id
        const isAwayTeam = dbGame.awayTeam.id === league.team.id
        const isPlayersTeam = isHomeTeam || isAwayTeam
        const pointsOnEitherGame = dbGame.awayTeamScore !== 0 && dbGame.homeTeamScore !== 0
        const hasHomeScore = !isNaN(dbGame.homeTeamScore)
        const hasAwayScore = !isNaN(dbGame.awayTeamScore)
        const isValidGame = (pointsOnEitherGame && hasHomeScore && hasAwayScore)

        if (isPlayersTeam && isValidGame) {
          const leagueGame = Object.assign({}, dbGame)
          leagueGame.playerTeamScore = isHomeTeam ? dbGame.homeTeamScore : dbGame.awayTeamScore
          leagueGame.opponentTeamScore = isHomeTeam ? dbGame.awayTeamScore : dbGame.homeTeamScore
          leagueGame.opponentTeam = isHomeTeam ? dbGame.awayTeam : dbGame.homeTeam
          leagueGame.opponentTeamName = leagueGame.opponentTeam.name
          league.totals.opponentTeamScore += leagueGame.opponentTeamScore
          league.totals.playerTeamScore += leagueGame.playerTeamScore

          leagueGame.stats = {
            assists: gameToStatsMap[leagueGame.id]?.assists || 0,
            scores: gameToStatsMap[leagueGame.id]?.scores || 0,
            defenses: gameToStatsMap[leagueGame.id]?.defenses || 0,
            overall: 0
          }

          statKeys.forEach((key) => {
            const stat = gameToStatsMap[leagueGame.id] ? gameToStatsMap[leagueGame.id][key] : 0
            leagueGame.stats[key] = stat
            league.totals[key] += stat
            allTimeTotals[key] += stat
            league.highStats[key] = Math.max(league.highStats[key], stat)
          })
          leagueGame.stats.overall = leagueGame.stats.assists + leagueGame.stats.scores + leagueGame.stats.defenses
          league.totals.overall += leagueGame.stats.overall

          leagueGame.outcome = leagueGame.playerTeamScore > leagueGame.opponentTeamScore ? 'W' : 'L'
          league.totals[leagueGame.outcome === 'W' ? 'wins' : 'losses']++
          acc.push(leagueGame)
        }
        return acc
      }, [])
    }
  })

  const firstCommunityLeague = leagueGameStatHistory[0] || null

  leagueGameStatHistory.sort(function (a, b) {
    return getMongoTimestamp(b.id) - getMongoTimestamp(a.id)
  })

  const player = getCanonicalPlayer(playerResults.data.allPlayers)
  const props = {
    player,
    allTimeTotals,
    leagueGameStatHistory,
    firstCommunityLeague
  }
  await updateWithGlobalServerSideProps(props)
  return {
    props
  }
}

export default function PlayerPage (props) {
  const { player, leagueGameStatHistory, leagues, allTimeTotals, firstCommunityLeague } = props
  const preferredPositions = getPreferredPositions(player.preferredPositions)
  const [animatedTotals, setAnimatedTotals] = useState({
    leagues: 0,
    scores: 0,
    assists: 0,
    defenses: 0
  })

  useEffect(() => {
    let frameId
    const duration = 900
    const startedAt = window.performance.now()

    function animate (now) {
      const progress = Math.min((now - startedAt) / duration, 1)
      const nextTotals = {}

      seasonStatCards.forEach(function (statCard) {
        nextTotals[statCard.key] = Math.round(allTimeTotals[statCard.key] * progress)
      })

      setAnimatedTotals(nextTotals)

      if (progress < 1) {
        frameId = window.requestAnimationFrame(animate)
      }
    }

    frameId = window.requestAnimationFrame(animate)

    return function cleanup () {
      window.cancelAnimationFrame(frameId)
    }
  }, [allTimeTotals])

  function getSeasonStatCellClassName (league, key, value) {
    if (value > 0 && value === league.highStats[key]) {
      return 'table-warning fw-bold'
    }

    return ''
  }

  return (
    <div>
      <SeoHead
        title={`${player.firstName} ${player.lastName} Statistics`}
        description={`See historical scores, assists, and defenses for ${player.firstName} ${player.lastName} across current and past SFLUltimate events.`}
        path={buildPlayerUrl(player)}
        image={player.profileImage?.publicUrl}
      />
      <HeaderNavigation leagues={leagues} />
      <div className="container">
        <div className="row align-items-center mb-4">
          {
            player.profileImage?.publicUrl && (
              <div className="col-md-4 mb-3 mb-md-0 text-center">
                <img
                  src={player.profileImage.publicUrl}
                  alt={player.firstName + ' ' + player.lastName}
                  className="img-fluid rounded"
                  style={{ maxHeight: '240px', objectFit: 'cover' }}
                />
              </div>
            )
          }
          <div className="col-md-8">
            <h1>{player.firstName} {player.lastName}</h1>
            {
              firstCommunityLeague && (
                <div className="d-flex align-items-center gap-3 mb-3 flex-wrap">
                  {
                    firstCommunityLeague.team?.image?.publicUrl && (
                      <a href={buildTeamUrl(firstCommunityLeague, firstCommunityLeague.team)}>
                        <img
                          src={firstCommunityLeague.team.image.publicUrl}
                          alt={firstCommunityLeague.team.name + ' logo'}
                          className="img-fluid rounded"
                          style={{ maxHeight: '72px', objectFit: 'contain' }}
                        />
                      </a>
                    )
                  }
                  <span className="badge text-bg-light border border-secondary fs-6">
                    Community Member Since <a href={buildLeagueStatsUrl(firstCommunityLeague)} className="text-reset">{getLeagueYearLabel(firstCommunityLeague)}</a>
                  </span>
                </div>
              )
            }
            {
              preferredPositions.length > 0 && (
                <div className="d-flex align-items-center flex-wrap gap-2">
                  <span className="lead mb-0 me-2">Preferred Positions:</span>
                  {
                    preferredPositions.map(function (position) {
                      return (
                        <PreferredPositionBadge key={position} position={position} />
                      )
                    })
                  }
                </div>
              )
            }
          </div>
        </div>
        <div className="row text-center mb-4">
          {
            seasonStatCards.map(function (statCard) {
              const statValue = animatedTotals[statCard.key]
              const statLabel = statValue === 1 ? statCard.singularLabel : statCard.label
              return (
                <div className="col-6 col-md-3 mb-3" key={statCard.key}>
                  <div className="rounded h-100 p-3 d-flex flex-column justify-content-center align-items-center">
                    <i className={`fa ${statCard.icon} fa-2x mb-2 text-primary`} aria-hidden="true"></i>
                    <strong style={{ fontSize: '2rem', lineHeight: '1' }}>{statValue}</strong>
                    <span className="text-uppercase text-muted mt-2" style={{ letterSpacing: '0.08em', fontSize: '0.85rem' }}>{statLabel}</span>
                  </div>
                </div>
              )
            })
          }
        </div>
        {leagueGameStatHistory.map((league, index) => (
          league.team && (
            <div key={index}>
              <h2><a href={buildLeagueStatsUrl(league)}>{league.title}</a></h2>
              {
                league.team.image?.publicUrl && (
                  <p style={{ marginBottom: '0.5rem' }}>
                    <a href={buildTeamUrl(league, league.team)}>
                      <img
                        src={league.team.image.publicUrl}
                        alt={league.team.name + ' logo'}
                        className="img-fluid rounded"
                        style={{ maxHeight: '110px', objectFit: 'contain' }}
                      />
                    </a>
                  </p>
                )
              }
              <p className="lead" style={{ marginBottom: '0.5rem' }}>
                <a href={buildTeamUrl(league, league.team)}>{league.team.name}</a>
              </p>
              <p><strong>Captains:</strong> {league.team.captains.map(c => c.firstName.trim() + ' ' + c.lastName.trim()).join(', ')}</p>
              <p>
                <strong>Players:</strong>{' '}
                {sortPlayersByName(league.team.players).map(function (teamPlayer, playerIndex) {
                  return (
                    <span key={teamPlayer.id}>
                      {playerIndex > 0 ? ', ' : ''}
                      <a href={buildPlayerUrl(teamPlayer)}>{teamPlayer.firstName.trim()} {teamPlayer.lastName.trim()}</a>
                    </span>
                  )
                })}
              </p>
              <table className="table table-bordered table-striped">
                <thead>
                  <tr>
                    <th>Game Date</th>
                    <th>Opponent</th>
                    <th>Team Score</th>
                    <th>Opponent Score</th>
                    <th>Outcome</th>
                    <th>Assists</th>
                    <th>Scores</th>
                    <th>Defenses</th>
                    <th>Overall</th>
                  </tr>
                </thead>
                <tbody>
                  {league.games.map((game, gameIndex) => (
                    <tr key={gameIndex}>
                      <td>{new Date(game.scheduledTime).toLocaleDateString('en-US', {
                        timeZone: 'America/New_York',
                        month: 'short',
                        day: 'numeric',
                        weekday: 'short'
                      })}</td>
                      <td><a href={buildTeamUrl(league, game.opponentTeam)}>{game.opponentTeamName}</a></td>
                      <td>{game.playerTeamScore}</td>
                      <td>{game.opponentTeamScore}</td>
                      <td>
                        <strong style={{ color: game.outcome === 'W' ? '#198754' : '#dc3545' }}>
                          {game.outcome}
                        </strong>
                      </td>
                      <td className={getSeasonStatCellClassName(league, 'assists', game.stats.assists)}>{game.stats.assists}</td>
                      <td className={getSeasonStatCellClassName(league, 'scores', game.stats.scores)}>{game.stats.scores}</td>
                      <td className={getSeasonStatCellClassName(league, 'defenses', game.stats.defenses)}>{game.stats.defenses}</td>
                      <td><strong>{game.stats.overall}</strong></td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="2"><strong>Total</strong></td>
                    <td><strong>{league.totals.playerTeamScore}</strong></td>
                    <td><strong>{league.totals.opponentTeamScore}</strong></td>
                    <td><WinLossRecord wins={league.totals.wins} losses={league.totals.losses} /></td>
                    <td><strong>{league.totals.assists}</strong></td>
                    <td><strong>{league.totals.scores}</strong></td>
                    <td><strong>{league.totals.defenses}</strong></td>
                    <td><strong>{league.totals.overall}</strong></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )
        ))}
        {/* <pre>{JSON.stringify(leagueGameStatHistory, null, 2)}</pre> */}
      </div>
    </div>
  )
}

//   const playerIds = matchingPlayers.map(getId)
//   const matchingTeams = await Team.model.find({
//     $or: [
//       {
//         captains: {
//           $in: playerIds
//         }
//       },
//       {
//         players: {
//           $in: playerIds
//         }
//       }
//     ]
//   }, {
//     players: 0,
//     captains: 0
//   }).lean()
//
//   const teamIds = matchingTeams.map(getId)
//   const matchingGames = await Game.model.find({
//     $or: [
//       {
//         homeTeam: {
//           $in: teamIds
//         }
//       },
//       {
//         awayTeam: {
//           $in: teamIds
//         }
//       }
//     ]
//   }).lean()
//
//   const matchingPlayerGameStats = await PlayerGameStat.model.find({
//     game: {
//       $in: matchingGames.map(getId)
//     },
//     player: {
//       $in: playerIds
//     }
//   }).lean()
//
//
//   const leagueToGamesMap = {}
//   matchingGames.forEach(function (game) {
//     const leagueId = game.league.toString()
//     if (!leagueToGamesMap[leagueId]) {
//       leagueToGamesMap[leagueId] = []
//     }
//     leagueToGamesMap[leagueId].push(game)
//   })
//
//   const gameToStatMap = {}
//   matchingPlayerGameStats.forEach(function (stat) {
//     const gameId = stat.game.toString()
//     gameToStatMap[gameId] = stat
//   })
//
//   const leagueToTeamMap = {}
//   matchingTeams.forEach(function (team) {
//     const leagueId = team.league.toString()
//     leagueToTeamMap[leagueId] = team
//   })
//
//   const teamNames = await Team.model.find({}, { name: 1 })
//   const teamNamesMap = {}
//   teamNames.forEach(function (team) {
//     teamNamesMap[team._id.toString()] = team.name
//   })
//
//   for (const league of leagueGameStatHistory) {
//     const leagueId = league._id.toString()
//
//     league.team = leagueToTeamMap[leagueId]
//     const leagueGames = leagueToGamesMap[leagueId] || []
//     league.games = league.games.sort(function (a, b) {
//       return b.scheduledTime.getTime() - a.scheduledTime.getTime()
//     })
//     for (const game of league.games) {
//       game.stats = gameToStatMap[game._id.toString()] || { assists: 0, scores: 0, defenses: 0 }
//       league.totals.assists += game.stats.assists || 0
//       league.totals.scores += game.stats.scores || 0
//       league.totals.defenses += game.stats.defenses || 0
//
//       const isHomeTeamPlayerTeam = game.homeTeam.toString() === league.team._id.toString()
//       game.playerTeamScore = isHomeTeamPlayerTeam ? game.homeTeamScore : game.awayTeamScore
//       game.opponentTeamScore = !isHomeTeamPlayerTeam ? game.homeTeamScore : game.awayTeamScore
//       game.opponentTeamName = !isHomeTeamPlayerTeam ? teamNamesMap[game.homeTeam.toString()] : teamNamesMap[game.awayTeam.toString()]
//
//
//       league.totals.opponentTeamScore += game.opponentTeamScore
//       league.totals.playerTeamScore += game.playerTeamScore
//       league.totals.outcomes.push(game.outcome)
//     }
//     // collapse into win loss (2W-2L)
//     league.totals.outcomes = league.totals.outcomes.sort().reduce(function (acc, entry) {
//       acc[entry]++
//       return acc
//     }, { W: 0, L: 0 })
//     league.totals.outcomes = league.totals.outcomes.W + 'W - ' + league.totals.outcomes.L + 'L'
//   }
//
//   res.locals.player = matchingPlayers[0]
//   res.locals.leagueGameStatHistory = leagueGameStatHistory
// }

/*

block head
    meta(property="og:title"        content="Player Stats for "+ player.name.first + " " + player.name.last)
    meta(property="og:url"          content="https://www.sflultimate.com/player/" + player.name.first.toLowerCase() + '-' + player.name.last.toLowerCase())
    meta(property="og:description"  content="Click here to learn more about this player's stats!")

 */
