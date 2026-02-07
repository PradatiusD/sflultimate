import { query } from './graphql-client'
import { gql } from '@apollo/client'
export async function updateWithGlobalServerSideProps (originalProps, context) {
  const results = await query({
    query: gql`
      query {
        allLeagues(sortBy: registrationStart_DESC) {
          title
          slug
        }
      }
    `
  })
  originalProps.leagues = results.data.allLeagues
}
