const { ApolloClient, InMemoryCache } = require('@apollo/client')

const GraphqlClient = new ApolloClient({
  uri: 'http://localhost:3000/admin/api',
  cache: new InMemoryCache()
})

module.exports = GraphqlClient
