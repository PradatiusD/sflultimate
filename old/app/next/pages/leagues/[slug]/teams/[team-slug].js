import { gql } from '@apollo/client'
import { addLeagueToVariables } from '../../../../lib/utils'
import GraphqlClient from '../../../../lib/graphql-client'

export const getServerSideProps = async (context) => {
  const variables = addLeagueToVariables(context, {})
  variables.teamSlug = context.params['team-slug']
  const results = await GraphqlClient.query({
    query: gql`
      fragment playerFields on Player {
        id
        gender
        firstName
        lastName
        skillLevel
        athleticismLevel
        experienceLevel
        throwsLevel
      }
      query($leagueCriteria: LeagueWhereInput, $teamSlug: String) {
        allTeams(where: {league: $leagueCriteria, name_i: $teamSlug}) {
          id,
          name
          color
          captains {
            ...playerFields
          }
          players {
            ...playerFields
          }
        }
      }`,
    variables
  })

  return {
    props: {
      team: results.data.allTeams[0],
      slug: context.params['team-slug']
    }
  }
}

export default function TeamPage (props) {
  const { slug, team } = props
  return (
    <div className="container">
      <h1>Team {slug}</h1>
      <p>{JSON.stringify(team)}</p>
    </div>
  )
}
