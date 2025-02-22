const { ApolloClient, InMemoryCache } = require('@apollo/client')

const GraphqlClient = new ApolloClient({
  uri: 'http://localhost:3000/admin/api',
  cache: new InMemoryCache(),
  defaultOptions: {
    query: {
      fetchPolicy: 'no-cache'
    },
    mutate: {
      fetchPolicy: 'network-only'
    }
  }
})

module.exports = GraphqlClient
