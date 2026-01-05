import { gql } from '@apollo/client'
import Head from 'next/head'
import { useState } from 'react'
import GraphqlClient from '../../../lib/graphql-client'
import { PlayerLink } from '../../../components/PlayerLink'
import { HeaderNavigation } from '../../../components/Navigation'
import LeagueUtils from '../../../lib/league-utils'
import { addLeagueToVariables } from '../../../lib/utils'

const getBadgeStyle = function (color) {
  let badgeColor
  if (color === 'rgba(1, 0, 0, 1)') {
    badgeColor = 'white'
  } else {
    badgeColor = 'black'
  }
  return {
    backgroundColor: color || 'white',
    color: badgeColor
  }
}
export async function getServerSideProps (context) {
  const variables = addLeagueToVariables(context)
  const results = await GraphqlClient.query({
    query: gql`
      query GetLeagueForDraftboard ($leagueCriteria: LeagueWhereInput) {
        allLeagues(where: $leagueCriteria) {
          id
          title
          earlyRegistrationStart
          earlyRegistrationEnd
          registrationStart
          registrationEnd
          lateRegistrationStart
          lateRegistrationEnd
        }
        allTeams(where: {league: $leagueCriteria}, sortBy: draftOrder_ASC) {
          id
          name
          color
          players {
            id
            firstName
            lastName
            gender
            skillLevel
            athleticismLevel
            experienceLevel
            throwsLevel
          }
        }
        allPlayers(where: {leagues_some: $leagueCriteria}) {
          id
          createdAt
          age
          shirtSize
          skillLevel
          athleticismLevel
          experienceLevel
          throwsLevel
          participation
          partnerName
          willAttendFinals
          firstName
          lastName
          gender
          wouldCaptain
          wouldSponsor
          preferredPositions
          comments
          leagues {
            id
            slug
          }
        }
      }
    `,
    variables
  })

  const teams = results.data.allTeams.map(function (team) {
    team.players = team.players
    return team
  })

  const league = results.data.allLeagues[0]
  LeagueUtils.addLeagueStatus(league)
  const teamMap = {}
  const playerToTeamMap = {}
  teams.forEach(function (team) {
    teamMap[team.id] = team
    team.players.forEach(function (player) {
      playerToTeamMap[player.id] = team.id
    })
  })

  let players = Array.from(results.data.allPlayers).map(function (player) {
    const p = Object.assign({}, player)
    p.team = playerToTeamMap[p.id] || null
    return p
  })

  const query = context.req.query
  if (query && query.draft_mode === 'true') {
    players = sortByGenderThenSkillFn(players)
  }
  return {
    props: {
      league,
      teams,
      teamMap,
      players,
      query,
      user: context.req.user ? context.req.user : null
    }
  }
}
export default function Draftboard (props) {
  const { league, user, teams, teamMap, players, query } = props

  const [activeData, setActiveData] = useState({
    players,
    teams,
    mode: query && query.draft_mode === 'true' ? 'draft' : 'default'
  })

  const modifyRoster = (team, playerToUpdate, action) => {
    if (action !== 'add' && action !== 'remove') {
      throw new Error('Invalid action')
    }
    return fetch('/api/draftboard', {
      method: 'PUT',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        action,
        teamId: team.id,
        playerId: playerToUpdate.id
      })
    }).then(function (res) {
      return res.json()
    }).then(function (response) {
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
        players: newPlayers,
        mode: 'draft'
      }
      setActiveData(newState)
    }).catch(function (e) {
      alert('There was an error modifying the roster')
      console.error(e)
    })
  }
  const sortPlayersByRecency = () => {
    const arrCopy = props.players.map(p => p)
    arrCopy.sort(function (a, b) {
      return b.createdAt.localeCompare(a.createdAt)
    })

    setActiveData({
      ...activeData,
      players: arrCopy
    })
  }
  const sortByGenderThenSkill = () => {
    const arrCopy = sortByGenderThenSkillFn(props.players)
    setActiveData({
      ...activeData,
      players: arrCopy
    })
  }
  const showOnlyCaptains = () => {
    const copy = props.players.filter(player => player.wouldCaptain)
    setActiveData({
      ...activeData,
      players: copy
    })
  }

  const showOnlySponsors = () => {
    const sponsors = props.players.filter(player => player.wouldSponsor)
    setActiveData({
      teams: activeData.teams,
      players: sponsors
    })
  }

  const showDraftMode = () => {
    const sortedPlayers = sortByGenderThenSkillFn(activeData.players)
    setActiveData({
      ...activeData,
      players: sortedPlayers,
      mode: 'draft'
    })
  }

  const formatDate = function (date) {
    return new Date(date).toLocaleString()
  }

  const largestTeamSize = Math.max(...activeData.teams.map(team => team.players.length))
  const rowsFromLargestTeamSize = []
  for (let i = 0; i < largestTeamSize; i++) {
    rowsFromLargestTeamSize.push(i)
  }

  const isDraftMode = activeData.mode === 'draft'
  const showComments = user && query.show_comments === 'true'

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
                <table className="table table table-striped">
                  <thead>
                  <tr>
                    <th></th>
                    {
                      activeData.teams.map((team) => {
                        return (
                          <th key={team.id} style={{ backgroundColor: team.color }}>
                            {team.name} ({team.players.length})
                          </th>
                        )
                      })
                    }
                  </tr>
                  </thead>
                  <tbody>
                  {
                    rowsFromLargestTeamSize.map((playerIndex) => {
                      return (
                        <tr key={playerIndex}>
                          <th>{playerIndex + 1}</th>
                          {
                            activeData.teams.map((team) => {
                              const player = team.players[playerIndex]
                              const key = team.id + '_' + playerIndex
                              if (!player) {
                                return <td key={key}/>
                              }
                              return (
                                <td key={key}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                      <span>
                                        {player.firstName} {player.lastName} ({player.gender?.charAt(0)}{player.skillLevel} {player.athleticismLevel + 'A ' + player.experienceLevel + 'E ' + player.throwsLevel + 'T'})
                                      </span>
                                    <button
                                      className="btn btn-secondary btn-sm"
                                      onClick={() => modifyRoster(team, player, 'remove')}>
                                      <i className="fa fa-close"></i>
                                    </button>
                                  </div>
                                </td>
                              )
                            })
                          }
                        </tr>
                      )
                    })
                  }
                  <tr>
                    <th></th>
                    {
                      activeData.teams.map((team) => {
                        const totalTeamScore = team.players.reduce((acc, player) => acc + getSkillScore(player), 0)
                        const teamAverageSkill = team.players.length > 0 ? Math.round(totalTeamScore / team.players.length * 10) / 10 : '0'
                        const teamTotalAthleticism = team.players.reduce((a, p) => a + (p.athleticismLevel || 0), 0)
                        const teamTotalExperience = team.players.reduce((a, p) => a + (p.experienceLevel || 0), 0)
                        const teamTotalThrows = team.players.reduce((a, p) => a + (p.throwsLevel || 0), 0)
                        return (
                          <th key={team.id} style={{ backgroundColor: team.color }}>
                            {team.name} ({team.players.length}) ({teamAverageSkill}) ({teamTotalAthleticism + 'A ' + teamTotalExperience + 'E ' + teamTotalThrows + 'T'})
                          </th>
                        )
                      })
                    }
                  </tr>
                  </tbody>
                </table>
              </div>
            )
          }

          <p className="lead">There are {players.length} players registered.</p>

          <div className="btn-group">
            <button className="btn btn-secondary" onClick={sortPlayersByRecency}>Sort By Recent</button>
            <button className="btn btn-secondary" onClick={sortByGenderThenSkill}>Sort By Gender, Then Skill</button>
            <button className="btn btn-secondary" onClick={showOnlyCaptains}>Show Only Captains</button>
            <button className="btn btn-secondary" onClick={showOnlySponsors}>Show Only Sponsors</button>
            <button className="btn btn-secondary" onClick={showDraftMode}>Draft Mode</button>
          </div>

          <table className="table table-hover table-striped">
            <thead>
            <tr>
              <th>Number</th>
              <th>Name</th>
              <th>Gender</th>
              {
                !isDraftMode && <th>Date Registered</th>
              }
              <th>Age</th>
              <th>Shirt Size</th>
              <th>Positions</th>
              <th>Skill (Old)</th>
              <th>Athl.</th>
              <th>Exp.</th>
              <th>Thr.</th>
              <th>Attendance</th>
              <th>Will Attend Finals?</th>
              <th>Partner</th>
              {
                showComments && <th>Comments</th>
              }
              {
                !isDraftMode && <th>Would Captain?</th>
              }
              {
                !isDraftMode && <th>Would Sponsor?</th>
              }
              {user && <th>Actions</th>}
            </tr>
            </thead>
            <tbody>
            {
              (activeData.mode === 'draft' ? activeData.players.filter(p => !p.team) : activeData.players).map((player, index) => {
                return (
                  <tr key={player.id}>
                    <td>{index + 1}</td>
                    <td><PlayerLink player={player} /></td>
                    <td>{player.gender?.charAt(0)}</td>
                    {
                      !isDraftMode && <td>{formatDate(player.createdAt)}</td>
                    }
                    <td>{player.age}</td>
                    <td>{player.shirtSize}</td>
                    <td>{player.preferredPositions}</td>
                    <td>{player.skillLevel}</td>
                    <td>{player.athleticismLevel}</td>
                    <td>{player.experienceLevel}</td>
                    <td>{player.throwsLevel}</td>
                    <td>{player.participation}</td>
                    <td>{player.willAttendFinals ? 'Yes' : 'No'}</td>
                    <td>{player.partnerName}</td>
                    <td>
                      {player.team && (
                        <span className="badge" style={getBadgeStyle(teamMap[player.team].color)}>
                            {teamMap[player.team].name}
                          </span>
                      )}
                      {
                        showComments && (
                          <small>
                            {player.comments}
                          </small>
                        )
                      }
                    </td>
                    {
                      !isDraftMode && <td>{player.wouldCaptain ? 'Yes' : ''}</td>
                    }
                    {
                      !isDraftMode && <td>{player.wouldSponsor ? 'Yes' : ''}</td>
                    }
                    <td>
                      {
                        user && isDraftMode && (
                          <div style={{ minWidth: '400px' }}>
                            {!player.team && teams.map((team, index) => {
                              return (
                                <button
                                  key={index}
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => {
                                    modifyRoster(team, player, 'add')
                                  }}>
                                  <i className="fa fa-plus" style={{ fontSize: '1.2rem' }}></i> {team.name}
                                </button>
                              )
                            })}
                          </div>
                        )
                      }
                    </td>
                  </tr>
                )
              })
            }
            </tbody>
          </table>
          <AnalyticsTables players={players} teamMap={teamMap} />
        </div>
      </div>
    </>
  )
}

function AnalyticsTables (props) {
  const { players, teamMap } = props
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
            teamMap[player.team].name,
            teamMap[player.team].color,
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
            teamMap[player.team].name,
            teamMap[player.team].color,
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
              {totals[mapName] && Object.entries(totals[mapName]).map(([key, count], rowIndex) => (
                <tr key={rowIndex}>
                  {
                    key.split('|').map((columnValue, colIndex) => (
                      <td key={colIndex} style={columnValue.indexOf('rgba') > -1 ? getBadgeStyle(columnValue) : {}}>
                        {columnValue}
                      </td>
                    ))
                  }
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

function getSkillScore (player) {
  if (!player) {
    return 0
  }
  if (player.skillLevel) {
    return player.skillLevel
  }

  return (player.athleticismLevel || 0) + (player.experienceLevel || 0) + (player.throwsLevel || 0)
}

function sortByGenderThenSkillFn (players) {
  const arrCopy = players.map(p => p)
  arrCopy.sort(function (a, b) {
    const aGender = a.gender === 'Female' ? 1 : 0
    const bGender = b.gender === 'Female' ? 1 : 0

    const genderDiff = bGender - aGender

    if (genderDiff === 0) {
      return getSkillScore(b) - getSkillScore(a)
    }

    return bGender - aGender
  })
  return arrCopy
}
