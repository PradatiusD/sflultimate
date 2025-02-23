const { ApolloClient, InMemoryCache } = require('@apollo/client')

const host = process.env.MONGOLAB_URI.includes('localhost') ? 'http://localhost:3000' : 'https://www.sflultimate.com'
const GraphqlClient = new ApolloClient({
  uri: host + '/admin/api',
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
