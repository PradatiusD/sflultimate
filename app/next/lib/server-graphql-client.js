async function execute ({ query, mutation, variables }) {
  const keystone = global.sflKeystone
  if (!keystone) {
    throw new Error('The Keystone instance is not available in this server process')
  }

  const context = keystone.createContext().sudo()
  const result = await keystone.executeGraphQL({
    context,
    query: query || mutation,
    variables
  })

  if (result.errors && result.errors.length > 0) {
    throw result.errors[0]
  }

  return JSON.parse(JSON.stringify(result))
}

module.exports = {
  query: execute,
  mutate: execute
}
