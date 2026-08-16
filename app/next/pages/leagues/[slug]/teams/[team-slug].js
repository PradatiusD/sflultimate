import Head from 'next/head'
import { gql } from '@apollo/client'
import { HeaderNavigation } from '../../../../components/Navigation'
import Standings from '../../../../components/Standings'
import GameStatTable from '../../../../components/GameStatTable'
import { addLeagueToVariables } from '../../../../lib/utils'
import GraphqlClient from '../../../../lib/graphql-client'
import { updateWithGlobalServerSideProps } from '../../../../lib/global-server-side-props'
import { buildTeamUrl, isMatchingTeamRoute } from '../../../../lib/team-utils'

function buildPositionMap (players = []) {
  return players.reduce(function (acc, player) {
    player?.preferredPositions?.split(', ').forEach(function (position) {
      if (position) {
        acc[position] = acc[position] || 0
        acc[position]++
      }
    })
    return acc
  }, {})
}

function buildTeamStats (players = [], playerGameStats = []) {
  const statMap = {}

  players.forEach(function (player) {
    statMap[player.id] = {
      player,
      assists: 0,
      scores: 0,
      defenses: 0,
      attended: true
    }
  })

  playerGameStats.forEach(function (stat) {
    if (!statMap[stat.player.id]) {
      return
    }
    statMap[stat.player.id].assists += stat.assists || 0
    statMap[stat.player.id].scores += stat.scores || 0
    statMap[stat.player.id].defenses += stat.defenses || 0
  })

  return Object.values(statMap).map(function (stat) {
    stat.total = stat.assists + stat.scores + stat.defenses
    return stat
  }).sort(function (a, b) {
    if (b.total !== a.total) {
      return b.total - a.total
    }
    const aName = `${a.player.firstName} ${a.player.lastName}`.toLowerCase()
    const bName = `${b.player.firstName} ${b.player.lastName}`.toLowerCase()
    return aName.localeCompare(bName)
  })
}

function buildRecord (teamId, games = []) {
  return games.reduce(function (record, game) {
    if (!game.homeTeam || !game.awayTeam) {
      return record
    }

    const isHome = game.homeTeam.id === teamId
    const isAway = game.awayTeam.id === teamId
    if (!isHome && !isAway) {
      return record
    }

    const teamScore = isHome ? game.homeTeamScore : game.awayTeamScore
    const opponentScore = isHome ? game.awayTeamScore : game.homeTeamScore
    const teamForfeit = isHome ? game.homeTeamForfeit : game.awayTeamForfeit
    const opponentForfeit = isHome ? game.awayTeamForfeit : game.homeTeamForfeit

    if (teamForfeit || opponentForfeit) {
      record.forfeits += teamForfeit ? 1 : 0
      if (teamForfeit && opponentForfeit) {
        record.losses++
      } else if (teamForfeit) {
        record.losses++
      } else if (opponentForfeit) {
        record.wins++
      }
      return record
    }

    const hasValidScore = teamScore !== 0 && opponentScore !== 0 && teamScore !== null && opponentScore !== null
    if (!hasValidScore) {
      return record
    }

    if (teamScore > opponentScore) {
      record.wins++
    } else {
      record.losses++
    }

    return record
  }, {
    wins: 0,
    losses: 0,
    forfeits: 0
  })
}

export const getServerSideProps = async (context) => {
  const variables = addLeagueToVariables(context, {})

  const teamResults = await GraphqlClient.query({
    query: gql`
      fragment playerFields on Player {
        id
        gender
        firstName
        lastName
        preferredPositions
        skillLevel
        athleticismLevel
        experienceLevel
        throwsLevel
      }

      query($leagueCriteria: LeagueWhereInput) {
        allLeagues(where: $leagueCriteria) {
          id
          title
          slug
        }
        allTeams(where: {league: $leagueCriteria}) {
          id
          name
          slug
          color
          image {
            publicUrl
          }
          captains {
            ...playerFields
          }
          players {
            ...playerFields
          }
          league {
            id
            title
            slug
          }
        }
      }
    `,
    variables
  })

  const team = teamResults.data.allTeams.find(foundTeam => isMatchingTeamRoute(foundTeam, context.params['team-slug']))
  const league = teamResults.data.allLeagues[0]

  if (!team || !league) {
    return {
      notFound: true
    }
  }

  const detailResults = await GraphqlClient.query({
    query: gql`
      query($leagueId: ID!, $teamId: ID!, $playerIds: [ID!]) {
        seasonGames: allGames(where: {league: {id: $leagueId}, OR: [{homeTeam: {id: $teamId}}, {awayTeam: {id: $teamId}}]}) {
          id
          scheduledTime
          homeTeamScore
          awayTeamScore
          homeTeamForfeit
          awayTeamForfeit
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
        }
        allPlayerGameStats(where: {player: {id_in: $playerIds}, game: {league: {id: $leagueId}}}) {
          assists
          scores
          defenses
          attended
          player {
            id
          }
        }
      }
    `,
    variables: {
      leagueId: league.id,
      teamId: team.id,
      playerIds: team.players.map(player => player.id)
    }
  })

  const fullTeam = {
    ...team,
    stats: buildTeamStats(team.players, detailResults.data.allPlayerGameStats)
  }
  const record = buildRecord(team.id, detailResults.data.seasonGames)
  const props = {
    league,
    record,
    seasonGames: detailResults.data.seasonGames,
    team: fullTeam,
    teamSlug: context.params['team-slug']
  }

  await updateWithGlobalServerSideProps(props, context)

  return {
    props
  }
}

export default function TeamPage (props) {
  const { league, leagues, record, seasonGames, team } = props
  const positionMap = buildPositionMap(team.players)
  const recordText = `${record.wins}-${record.losses}${record.forfeits > 0 ? ` (${record.forfeits} forfeits)` : ''}`

  return (
    <>
      <Head>
        <title>{league.title} Team: {team.name}</title>
        <meta property="og:title" content={`${league.title} Team: ${team.name}`} />
        <meta property="og:url" content={`https://www.sflultimate.com${buildTeamUrl(league, team)}`} />
        <meta property="og:description" content={`See the ${team.name} roster and season stats for ${league.title}.`} />
      </Head>
      <HeaderNavigation leagues={leagues} />
      <div className="container">
        <p className="h1 text-center">{league.title}</p>
        <div className="text-center mb-4">
          {
            team.image && team.image.publicUrl
              ? (
                <div style={{ maxWidth: '400px', margin: '0 auto' }}>
                  <img src={team.image.publicUrl} className="img-fluid rounded" alt={team.name} style={{ maxWidth: '100%', objectFit: 'contain' }}/>
                </div>
                )
              : (
                <h1>{team.name}</h1>
                )
          }
          {
            team.image && team.image.publicUrl && (
              <h1 className="mt-3">{team.name}</h1>
            )
          }
          <p className="lead mb-1">
            <strong>Season Record:</strong>{' '}
            <span style={{ color: '#198754' }}>{record.wins}W</span>
            {' - '}
            <span style={{ color: '#dc3545' }}>{record.losses}L</span>
          </p>
          {
            record.forfeits > 0 && (
              <p className="lead mb-1"><strong>Forfeits:</strong> {record.forfeits}</p>
            )
          }
          {
            team.captains.length > 0 && (
              <p className="lead mb-1">
                <strong>Captain{team.captains.length > 1 ? 's' : ''}:</strong> {team.captains.map(captain => `${captain.firstName} ${captain.lastName}`).join(', ')}
              </p>
            )
          }
          {
            Object.keys(positionMap).length > 0 && (
              <p className="lead d-flex justify-content-around flex-wrap">
                <span>Player Positions:</span>
                {
                  Object.keys(positionMap).sort().map(position => (
                    <span key={position}>
                      <strong>{position.charAt(0).toUpperCase() + position.slice(1)}</strong>: {positionMap[position]}
                    </span>
                  ))
                }
              </p>
            )
          }
        </div>

        <p className="h3 text-center">Season Standings</p>
        <Standings
          games={seasonGames}
          league={league}
          teamsFilter={(standingTeam) => standingTeam.id === team.id}
        />

        <p className="h3 text-center">Roster</p>
        <p className="lead text-center"><strong>Record:</strong> {recordText}</p>
        <GameStatTable team={team} isGamePreview />
      </div>
    </>
  )
}
