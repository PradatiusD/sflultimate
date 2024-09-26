
import { ApolloClient, InMemoryCache } from '@apollo/client'

const GraphqlClient = new ApolloClient({
  uri: 'http://localhost:3000/admin/api',
  cache: new InMemoryCache()
})

export default GraphqlClient
