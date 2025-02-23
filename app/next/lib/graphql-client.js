const { ApolloClient, InMemoryCache } = require('@apollo/client')

const GraphqlClient = new ApolloClient({
  uri: process.env.MONGOLAB_URI.includes('localhost') ? 'https://www.sflultimate.com/admin/api' : 'http://localhost:3000/admin/api',
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
