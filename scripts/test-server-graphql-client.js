const assert = require('assert')

const calls = []
const sudoContext = { access: 'sudo' }
const keystone = {
  createContext: () => ({ sudo: () => sudoContext }),
  executeGraphQL: async options => {
    calls.push(options)
    return { data: { ok: true, date: new Date('2026-09-07T12:00:00.000Z') } }
  }
}

global.sflKeystone = keystone

async function run () {
  const client = require('../app/next/lib/server-graphql-client')
  const query = { kind: 'Document', operation: 'query' }
  const mutation = { kind: 'Document', operation: 'mutation' }

  const queryResult = await client.query({ query, variables: { id: 'query-id' } })
  const mutationResult = await client.mutate({ mutation, variables: { id: 'mutation-id' } })

  assert.deepStrictEqual(queryResult, { data: { ok: true, date: '2026-09-07T12:00:00.000Z' } })
  assert.deepStrictEqual(mutationResult, { data: { ok: true, date: '2026-09-07T12:00:00.000Z' } })
  assert.deepStrictEqual(calls, [
    { context: sudoContext, query, variables: { id: 'query-id' } },
    { context: sudoContext, query: mutation, variables: { id: 'mutation-id' } }
  ])

  keystone.executeGraphQL = async () => ({ errors: [new Error('denied')] })
  await assert.rejects(
    client.query({ query }),
    error => error.message === 'denied'
  )

  console.log('server-graphql-client tests passed')
}

run().catch(error => {
  console.error(error)
  process.exitCode = 1
})
