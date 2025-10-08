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
  const players = playersRegistered.data.allPlayers
  LeagueUtils.addLeagueStatus(league)
  return { props: { league, teams, url: context.req.url, players } }
}

function PlayerGallery (props) {
  const { players } = props
  console.log(players)
  return (
    <div className="container">
      <div className="pending-team-grid">
        {
          players.map((player) => {
            const srcUrl = player.profileImage && player.profileImage.publicUrl ? player.profileImage.publicUrl : 'https://placehold.co/200x200?text=Image+Pending'
            return (
              <div key={player.id} className="pending-team">
                {
                  srcUrl && <img src={srcUrl} className="img-responsive img-rounded" />
                }
                <PlayerLink player={player} />
              </div>
            )
          })
        }
      </div>
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
        </div>
        <PlayerGallery {...props} />
      </>
    )
  }

  return (
    <>
      <div className="container">
        <h1>{league.title} Teams</h1>
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
                      <small className="text-muted">{womenTotal} women, {menTotal} men</small>
                    </p>
                    <table className="table table-striped table-bordered">
                      <tbody>
                      {
                        team.players.map((player, index) => {
                          const gender = player?.gender?.charAt(0)
                          return (
                            <tr key={player.id}>
                              <td>{index + 1}. {gender} - <PlayerLink player={player} /></td>
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
      <hr />
      <PlayerGallery {...props} />
    </>
  )
}
