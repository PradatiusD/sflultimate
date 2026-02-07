import { query } from './graphql-client'
import { gql } from '@apollo/client'
export async function updateWithGlobalServerSideProps (originalProps, context) {
  const results = await query({
    query: gql`
      query {
        allLeagues(sortBy: registrationStart_DESC) {
          title
          slug
          registrationStart
        }
      }
    `
  })

  results.data.allLeagues = results.data.allLeagues.map(function (result) {
    if (!result.registrationStart) {
      result.registrationStart = parseInt(result.title.match(/\d+/g))
    }
    return result
  })

  results.data.allLeagues.sort((a, b) => {
    return new Date(b.registrationStart) - new Date(a.registrationStart)
  })

  originalProps.leagues = results.data.allLeagues
}
