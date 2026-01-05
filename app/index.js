require('dotenv').config({ path: './../.env' })
const { GraphQLApp } = require('@keystonejs/app-graphql')
const { AdminUIApp } = require('@keystonejs/app-admin-ui')
const { PasswordAuthStrategy } = require('@keystonejs/auth-password')
const { NextApp } = require('@keystonejs/app-next')
const PROJECT_NAME = 'SFLUltimate'
const keystone = require('.`/keystone')
const contentListSchemas = require('./lists/index')

for (const listName in contentListSchemas) {
  const schema = contentListSchemas[listName]
  keystone.createList(listName, schema)
  if (schema.extendGraphQLSchema) {
    keystone.extendGraphQLSchema(schema.extendGraphQLSchema)
  }
}

const authStrategy = keystone.createAuthStrategy({
  type: PasswordAuthStrategy,
  list: 'User',
  config: {
    identifyField: 'email',
    secretField: 'password'
  }
})

module.exports = {
  keystone,
  configureExpress: app => {
    // to handle being behind heroku
    app.set('trust proxy', true)
  },
  apps: [
    new GraphQLApp({
      schemaName: 'public',
      apollo: {
        formatError: (err) => {
          console.error(err)
          return err
        }
      }
    }),
    new AdminUIApp({
      name: PROJECT_NAME,
      enableDefaultRoute: false,
      schemaName: 'public',
      authStrategy: authStrategy
    }),
    new NextApp({ dir: 'next' })
  ]
}
