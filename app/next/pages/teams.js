import Head from 'next/head'
import { gql } from '@apollo/client'
import GraphqlClient from '../lib/graphql-client'
export const getServerSideProps = async () => {
  const results = await GraphqlClient.query({
    query: gql`
      query {
        allLeagues(where:{isActive: true}) {
          title
        }
        allTeams(where: {league: {isActive: true}}) {
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
      }`
  })
  const league = results.data.allLeagues[0]
  const teams = results.data.allTeams
  return { props: { league, teams } }
}

export default function LeagueTeamsPage (props) {
  const {league, teams} = props
  console.log(props)
  return (
    <>
      <Head>
        <meta property="og:title" content="League Teams" />
        <meta property="og:url" content="https://www.sflultimate.com/teams" />
        <meta property="og:description" content={"Find out who is on your team for " + league.title} />
        <meta property="og:image" content="https://www.sflultimate.com/images/open-graph/homepage.jpg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
      </Head>
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
                    <h3><span className="team-color" style={{backgroundColor: team.color}}></span>{team.name}</h3>
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
                          const gender = player.gender.charAt(0)
                          return (
                            <tr key={player._id}>
                              <td>{index + 1}. {gender} - {player.firstName} {player.lastName}</td>
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
    </>
  )
}
