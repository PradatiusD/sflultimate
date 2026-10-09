import { query } from './server-graphql-client'
import { gql } from '@apollo/client'
export async function updateWithGlobalServerSideProps (originalProps, context) {
  const results = await query({
    query: gql`
      query {
        allLeagues(sortBy: registrationStart_DESC) {
          title
          slug
          registrationStart
          isActive
          registrationEnd
          slug
        }
      }
    `
  })

  results.data.allLeagues = results.data.allLeagues.map(function (league) {
    if (!league.registrationStart) {
      league.registrationStart = new Date(parseInt(league.title.match(/\d+/g)))
    }
    league.registrationStart = league.registrationStart instanceof Date ? league.registrationStart.toISOString() : league.registrationStart.toString()
    return league
  })

  results.data.allLeagues.sort((a, b) => {
    return new Date(b.registrationStart) - new Date(a.registrationStart)
  })

  originalProps.leagues = results.data.allLeagues
}
