import { gql } from '@apollo/client'
import Head from 'next/head'
import { useState } from 'react'
import GraphqlClient from '../lib/graphql-client'
import { addLeagueStatus } from '../lib/payment-utils'
import { PlayerLink } from '../components/PlayerLink'
import { HeaderNavigation } from '../components/Navigation'

export async function getServerSideProps (context) {
  const queryVars = {
    leagueFilter: {}
  }
  if (context.req.query.league_id) {
    queryVars.leagueFilter = {
      id: context.req.query.league_id
    }
  } else {
    queryVars.leagueFilter.isActive = true
  }
  const results = await GraphqlClient.query({
    query: gql`
      query GetLeagueForDraftboard ($leagueFilter: LeagueWhereInput) {
        allLeagues(where: $leagueFilter) {
          id
          title
          earlyRegistrationStart
          earlyRegistrationEnd
          registrationStart
          registrationEnd
          lateRegistrationStart
          lateRegistrationEnd
        }
        allTeams(where: {league: $leagueFilter}, sortBy: name_ASC) {
          id,
          name,
          players {
            id,
            firstName
            lastName
            gender
          }
        }
        allPlayers(where: {leagues_some: $leagueFilter}, sortBy: createdAt_DESC) {
          id
          createdAt,
          age,
          shirtSize,
          skillLevel,
          participation,
          partnerName,
          willAttendFinals
          firstName,
          lastName,
          gender,
          wouldCaptain,
          wouldSponsor,
          preferredPositions,
          comments
        }
      }`,
    variables: queryVars
  })
  const teams = results.data.allTeams
  const league = results.data.allLeagues[0]
  addLeagueStatus(league)

  const playerToTeamMap = {}
  teams.forEach(function (team) {
    team.players.forEach(function (player) {
      playerToTeamMap[player.id] = team.id
    })
  })

  const players = Array.from(results.data.allPlayers).map(function (player) {
    const p = Object.assign({}, player)
    p.team = playerToTeamMap[p.id] || null
    return p
  })

  return {
    props: {
      league,
      teams,
      players,
      user: context.req.user ? context.req.user : null
    }
  }
}

export default function Draftboard (props) {
  const { league, user, teams, players } = props

  const [activeData, setActiveData] = useState({
    players: players,
    teams: teams
  })

  const modifyRoster = (team, playerToUpdate, action) => {
    const mutation = gql`
      mutation update($id: ID!, $data: TeamUpdateInput) {
        updateTeam(id: $id, data: $data) {
          id,
          name,
          players {
            id,
            firstName
            lastName
            gender
          }
        }
      }
    `
    const params = {
      mutation: mutation,
      variables: {
        id: team.id,
        data: {
          players: {
          }
        }
      }
    }
    if (action === 'add') {
      params.variables.data.players.connect = { id: playerToUpdate.id }
    } else if (action === 'remove') {
      params.variables.data.players.disconnect = { id: playerToUpdate.id }
    } else {
      throw new Error('Invalid action')
    }
    return GraphqlClient.mutate(params).then(function (response) {
      const newTeams = activeData.teams.map(t => {
        if (t.id === response.data.updateTeam.id) {
          return response.data.updateTeam
        }
        return t
      })

      const newPlayers = activeData.players.map(p => {
        const isPlayerId = p.id === playerToUpdate.id
        if (isPlayerId) {
          const newP = Object.assign({}, p)
          newP.team = action === 'add' ? response.data.updateTeam.id : null
          return newP
        }
        return p
      })
      const newState = {
        teams: newTeams,
        players: newPlayers
      }
      setActiveData(newState)
    }).catch(function (e) {
      console.error(e)
    })
  }
  const sortPlayersByRecency = () => {
    const arrCopy = props.players.map(p => p)
    arrCopy.sort(function (a, b) {
      return b.createdAt.localeCompare(a.createdAt)
    })

    setActiveData({
      teams: activeData.players,
      players: arrCopy
    })
  }
  const sortByGenderThenSkill = () => {
    const arrCopy = props.players.map(p => p)
    arrCopy.sort(function (a, b) {
      const aGender = a.gender === 'Female' ? 1 : 0
      const bGender = b.gender === 'Female' ? 1 : 0

      const genderDiff = bGender - aGender

      if (genderDiff === 0) {
        return b.skillLevel - a.skillLevel
      }

      return bGender - aGender
    })
    setActiveData({
      teams: activeData.players,
      players: arrCopy
    })
  }
  const showOnlyCaptains = () => {
    const copy = props.players.filter(player => player.wouldCaptain)
    setActiveData({
      teams: activeData.players,
      players: copy
    })
  }

  const showOnlySponsors = () => {
    const sponsors = props.players.filter(player => player.wouldSponsor)
    setActiveData({
      teams: activeData.players,
      players: sponsors
    })
  }

  const formatDate = function (date) {
    return new Date(date).toLocaleString()
  }

  const getBadgeStyle = function (player) {
    if (!player || !player.team) {
      return {}
    }

    return {
      backgroundColor: player.team && player.team.color ? player.team.color : 'white',
      color: player && player.team.color === '#ffffff' ? 'black' : 'black'
    }
  }

  return (
    <>
      <Head>
        <title>{league?.title} Draftboard</title>
      </Head>
      <HeaderNavigation league={league} />
      <div className="container-fluid">
        <h1>{league?.title} Draftboard</h1>
        <div id="draftboard">
          {
            user && (
              <div className="drafted-teams row">
                {activeData.teams.map((team, index) => (
                  <div className="col-md-4" key={index}>
                    <table className="table table-striped">
                      <thead>
                        <tr>
                          <th>{team.name} ({team.players.length})</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {
                          team.players.map((player, index) => {
                            return (
                              <tr key={index}>
                                <td>{player.firstName} {player.lastName} ({player.gender.charAt(0)})</td>
                                <td>
                                  <button className="btn btn-default btn-sm" onClick={() => modifyRoster(team, player, 'remove')}>Remove
                                  </button>
                                </td>
                              </tr>
                            )
                          }
                          )}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            )
          }

          <p className="lead">There are {players.length} players registered.</p>

          <div className="btn-group">
            <button className="btn btn-default" onClick={sortPlayersByRecency}>Sort By Recent</button>
            <button className="btn btn-default" onClick={sortByGenderThenSkill}>Sort By Gender, Then Skill</button>
            <button className="btn btn-default" onClick={showOnlyCaptains}>Show Only Captains</button>
            <button className="btn btn-default" onClick={showOnlySponsors}>Show Only Sponsors</button>
          </div>

          <table className="table table-hover table-striped">
            <thead>
              <tr>
                <th>Number</th>
                <th>Name</th>
                <th>Gender</th>
                <th>Date Registered</th>
                <th>Age</th>
                <th>Shirt Size</th>
                <th>Positions</th>
                <th>Skill</th>
                <th>Attendance</th>
                <th>Will Attend Finals?</th>
                <th>Partner</th>
                <th>Comments</th>
                <th>Would Captain?</th>
                <th>Would Sponsor?</th>
                {user && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {activeData.players.map((player, index) => {
                return (
                  <tr key={player.id}>
                    <td>{index + 1}</td>
                    <td><PlayerLink player={player} /></td>
                    <td>{player.gender.charAt(0)}</td>
                    <td>{formatDate(player.createdAt)}</td>
                    <td>{player.age}</td>
                    <td>{player.shirtSize}</td>
                    <td>{player.preferredPositions}</td>
                    <td>{player.skillLevel}</td>
                    <td>{player.participation}</td>
                    <td>{player.willAttendFinals ? 'Yes' : 'No'}</td>
                    <td>{player.partnerName}</td>
                    <td>
                      <small className="badge"
                        style={getBadgeStyle(player)}>{player.team ? 'Rostered' : 'Unassigned'}</small> {player.comments}
                    </td>
                    <td>{player.wouldCaptain ? 'Yes' : ''}</td>
                    <td>{player.wouldSponsor ? 'Yes' : ''}</td>
                    <td>
                      {user && !player.team && teams.map((team, index) => {
                        return (
                          <button
                            key={index}
                            className="btn btn-default"
                            onClick={() => {
                              modifyRoster(team, player, 'add')
                            }}>
                          Add To {team.name}
                          </button>
                        )
                      })}
                    </td>
                  </tr>
                )
              })
              }
            </tbody>
          </table>
          <AnalyticsTables players={players} />
        </div>
      </div>
    </>
  )
}

function AnalyticsTables (props) {
  const { players } = props
  const columnsForTotals = {
    gender: ['Gender'],
    participation: ['Participation %'],
    playersPerTeam: ['Number of Teams'],
    playersPerTeamWithAttendance: ['Number of Teams'],
    genderPerTeam: ['Number of Teams', 'Gender'],
    genderPerTeamWithAttendance: ['Number of Teams', 'Gender'],
    insuranceGroup: ['Age Range'],
    shirtSize: ['Shirt Size'],
    shirtSizeWithGender: ['Shirt Size', 'Gender'],
    teamNameAndColorWithShirtSize: ['Team Name', 'Team Color', 'Size'],
    teamColorAndNameWithShirtSizeAndGender: ['Team Name', 'Team Color', 'Size', 'Gender'],
    registeredOnDate: ['Date'],
    registeredOnWeekday: ['Weekday'],
    registeredAtHour: ['Hour']
  }

  const totals = {
    playersPerTeam: {},
    playersPerTeamWithAttendance: {},
    genderPerTeam: {},
    genderPerTeamWithAttendance: {}
  }

  const keysForTotals = Object.keys(columnsForTotals)
  const teamSizes = [4, 5, 6, 7, 8]
  for (const countKey in totals) {
    teamSizes.forEach(function (teamsAmount) {
      if (!countKey.startsWith('gender')) {
        totals[countKey][teamsAmount] = 0
      }
    })
  }

  const JOIN_CHAR = '|'
  players.forEach(function (player) {
    keysForTotals.forEach(function (key) {
      if (!totals[key]) {
        totals[key] = {}
      }
      const totalKey = totals[key]
      let value = player[key]
      if (key === 'shirtSizeWithGender') {
        value = [
          player.shirtSize,
          player.gender
        ].join(JOIN_CHAR)
      }

      if (key === 'teamColorAndNameWithShirtSizeAndGender') {
        if (player.team) {
          value = [
            player.team.name,
            player.team.color,
            player.shirtSize,
            player.gender
          ].join(JOIN_CHAR)
        } else {
          value = [
            'No Team',
            'No Color',
            player.shirtSize,
            player.gender
          ].join(JOIN_CHAR)
        }
      }

      if (key === 'teamNameAndColorWithShirtSize') {
        if (player.team) {
          value = [
            player.team.name,
            player.team.color,
            player.shirtSize
          ].join(JOIN_CHAR)
        } else {
          value = [
            'No Team',
            'No Color',
            player.shirtSize
          ].join(JOIN_CHAR)
        }
      }

      if (key === 'registeredOnDate') {
        value = new Date(player.createdAt).toLocaleDateString('en-CA', {
          year: 'numeric',
          month: 'numeric',
          day: 'numeric'
        })
      }

      if (key === 'registeredOnWeekday') {
        value = new Date(player.createdAt).toLocaleString('en-US', { weekday: 'long' })
      }

      if (key === 'registeredAtHour') {
        value = new Date(player.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', hour12: false })
      }

      if (key === 'insuranceGroup') {
        const age = player.age
        // <12 13-15 16-19 20+
        if (age <= 12) {
          value = '12 and under'
        } else if (age <= 15) {
          value = '13-15'
        } else if (age <= 19) {
          value = '16-19'
        } else {
          value = '20+'
        }
      }

      if (value) {
        if (!totalKey[value]) {
          totalKey[value] = 0
        }
        totalKey[value]++
      }
    })

    teamSizes.forEach(function (teamsAmount) {
      const perTeamScore = 1 / teamsAmount
      const perTeamScoreWeightedWithParticipation = (perTeamScore * parseInt(player.participation) / 100)
      const teamNumberAndGenderKey = [teamsAmount, player.gender].join(JOIN_CHAR)

      totals.playersPerTeam[teamsAmount] += perTeamScore
      totals.playersPerTeamWithAttendance[teamsAmount] += perTeamScoreWeightedWithParticipation

      if (!totals.genderPerTeam[teamNumberAndGenderKey]) {
        totals.genderPerTeam[teamNumberAndGenderKey] = 0
      }

      if (!totals.genderPerTeamWithAttendance[teamNumberAndGenderKey]) {
        totals.genderPerTeamWithAttendance[teamNumberAndGenderKey] = 0
      }

      totals.genderPerTeam[teamNumberAndGenderKey] += perTeamScore
      totals.genderPerTeamWithAttendance[teamNumberAndGenderKey] += perTeamScoreWeightedWithParticipation
    })
  })

  for (const key in totals) {
    totals[key] = Object.keys(totals[key]).sort().reduce(function (obj, subKey) {
      obj[subKey] = totals[key][subKey]
      return obj
    }, {})
  }
  return (
    <div className="row">
      <div className="col-md-12">
        <h3>Breakdowns</h3>
        {keysForTotals.map((mapName, index) => (
          <div key={index} className="col-md-6">
            <h4>{mapName}</h4>
            <table className="table table-bordered table-striped">
              <thead>
                <tr>
                  {columnsForTotals[mapName].map((column, colIndex) => (
                    <th key={colIndex}>{column}</th>
                  ))}
                  <th>Count</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(totals[mapName]).map(([key, count], rowIndex) => (
                  <tr key={rowIndex}>
                    {key.split('|').map((columnValue, colIndex) => (
                      <td key={colIndex}>{columnValue}</td>
                    ))}
                    <td>{count.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  )
}
