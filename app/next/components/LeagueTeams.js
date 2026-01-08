import { PlayerLink } from './PlayerLink'
import GraphqlClient from '../lib/graphql-client'
import LeagueUtils from '../lib/league-utils'
import { gql } from '@apollo/client'
import { addLeagueToVariables } from '../lib/utils'

export const getLeagueTeamsData = async (context) => {
  const variables = addLeagueToVariables(context, {})
  const results = await GraphqlClient.query({
    query: gql`
      query($leagueCriteria: LeagueWhereInput) {
        allLeagues(where:$leagueCriteria) {
          title
          earlyRegistrationStart
          earlyRegistrationEnd
          registrationStart
          registrationEnd
          lateRegistrationStart
          lateRegistrationEnd
          registrationShareImage {
            publicUrl
          }
        }
        allTeams(where: {league: $leagueCriteria}) {
          id,
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
            profileImage {
              publicUrl
            }
          }
        }
        allPlayers(where: {profileImage_not: null}) {
          firstName
          lastName
          profileImage {
            publicUrl
          }
        }
      }`,
    variables
  })
  const league = results.data.allLeagues[0]
  const teams = results.data.allTeams
  const playersRegistered = await GraphqlClient.query({
    query: gql`
        query($leagueCriteria: LeagueWhereInput) {
          allPlayers(sortBy: [gender_ASC, firstName_ASC, lastName_ASC], where: {leagues_some: $leagueCriteria}) {
            id
            gender
            firstName
            lastName
            profileImage {
              publicUrl
            }
          }
        }`,
    variables
  })
  const profileMap = {}
  for (const player of results.data.allPlayers) {
    profileMap[player.firstName.toLowerCase() + ' ' + player.lastName.toLowerCase()] = player.profileImage.publicUrl
  }
  playersRegistered.data.allPlayers.forEach(player => {
    const key = player.firstName.toLowerCase() + ' ' + player.lastName.toLowerCase()
    if (profileMap[key]) {
      player.profileImage = { publicUrl: profileMap[key] }
    }
  })
  const players = playersRegistered.data.allPlayers
  LeagueUtils.addLeagueStatus(league)
  return { props: { league, teams, url: context.req.url, players } }
}

function PlayerImage (props) {
  const { player } = props
  const srcUrl = player.profileImage && player.profileImage.publicUrl ? player.profileImage.publicUrl : 'https://placehold.co/200x200?text=Image+Pending'
  return (
    <img src={srcUrl} className="img-responsive img-rounded" />
  )
}

function PlayerImageWithName (props) {
  const { player } = props
  return (
    <div key={player.id}>
      <PlayerImage player={player} />
      <PlayerLink player={player} />
    </div>
  )
}

function PlayerGallery (props) {
  const { players } = props
  return (
    <div className="pending-team-grid">
      {
        players.map((player) => {
          return <PlayerImageWithName key={player} player={player} className="pending-team" />
        })
      }
    </div>
  )
}

export default function LeagueTeams (props) {
  const { league, teams } = props

  if (teams.length === 0) {
    return (
      <>
        <div className="container">
          <h1>Teams Pending...</h1>
          <p className="lead">Players haven&#39;t been drafted yet, but here is who we have signed up so far!</p>
          <PlayerGallery {...props} />
        </div>
      </>
    )
  }

  return (
    <>
      <div className="container">
        <h1>{league.title}</h1>
        <h2>Teams</h2>
        <hr/>
        <div className="team-list">
          <section>
            {
              teams.map((team, index) => {
                let menTotal = 0
                let womenTotal = 0
                team.players.forEach(function (player) {
                  if (player.gender === 'Male') {
                    menTotal++
                  }
                  if (player.gender === 'Female') {
                    womenTotal++
                  }
                })

                return (
                  <article key={team.id}>
                    <h3><span className="team-color" style={{ backgroundColor: team.color }}></span>{team.name}</h3>
                    <p className="lead">
                      {
                        team.captains.length > 0 && (
                          <>
                            <span>Captain{team.captains.length > 1 ? 's' : ''}: </span>
                            {
                              team.captains.map((captain, index) => {
                                return (
                                  <span
                                    key={index}>{captain.firstName} {captain.lastName}{index < team.captains.length - 1 ? ', ' : ''}</span>
                                )
                              })
                            }
                            <br/>
                          </>
                        )
                      }
                      <small className="text-muted">{womenTotal} women, {menTotal} men</small>
                    </p>
                    <table className="table table-striped table-bordered">
                      <tbody>
                      {
                        team.players.map((player, index) => {
                          const gender = player?.gender?.charAt(0)
                          return (
                            <tr key={player.id}>
                              <td>{index + 1}. <PlayerImage player={player} /> {gender} - <PlayerLink player={player} /></td>
                            </tr>
                          )
                        })
                      }
                      </tbody>
                    </table>
                  </article>
                )
              })
            }
          </section>
        </div>
      </div>
      <div className="container">
        <h2>Players</h2>
        <hr/>
        <PlayerGallery {...props} />
      </div>
    </>
  )
}
