const { ApolloClient, InMemoryCache } = require('@apollo/client')

let host
const hosts = {
  dev: 'http://localhost:3000',
  prod: 'https://www.sflultimate.com'
}

if (typeof window === 'undefined') {
  host = !process.env.MONGOLAB_URI || process.env.MONGOLAB_URI.includes('localhost') ? hosts.dev : hosts.prod
} else {
  if (window.location.host.includes('localhost')) {
    host = hosts.dev
  } else {
    host = hosts.prod
  }
}
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
