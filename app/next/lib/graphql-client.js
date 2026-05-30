const { ApolloClient, HttpLink, InMemoryCache } = require('@apollo/client')

function getGraphqlHost () {
  if (process.env.NEXT_PUBLIC_KEYSTONE_URL) {
    return process.env.NEXT_PUBLIC_KEYSTONE_URL
  }

  if (process.env.KEYSTONE_URL) {
    return process.env.KEYSTONE_URL
  }

  if (typeof window !== 'undefined') {
    if (window.location.host.includes('localhost')) {
      return 'http://localhost:3000'
    }

    return 'https://www.sflultimate.com'
  }

  return 'http://localhost:3000'
}

const GraphqlClient = new ApolloClient({
  link: new HttpLink({
    uri: getGraphqlHost() + '/api/graphql'
  }),
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
module.exports.default = GraphqlClient
module.exports.query = GraphqlClient.query.bind(GraphqlClient)
module.exports.mutate = GraphqlClient.mutate.bind(GraphqlClient)
