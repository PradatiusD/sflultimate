require('dotenv').config({ path: './../.env' })
const { GraphQLApp } = require('@keystonejs/app-graphql')
const { AdminUIApp } = require('@keystonejs/app-admin-ui')
const { PasswordAuthStrategy } = require('@keystonejs/auth-password')
const { NextApp } = require('@keystonejs/app-next')
const PROJECT_NAME = 'SFLUltimate'
const keystone = require('./keystone')

const migratedLists = [
  'BoardMember',
  'BoardPosition',
  'ClubTeam',
  'Event',
  'Game',
  'League',
  'Location',
  'Player',
  'PlayerGameStat',
  'Team',
  'Pickup',
  'User'
]

for (const listName of migratedLists) {
  const filePath = './lists/' + listName
  const BoardMemberSchema = require(filePath)
  keystone.createList(listName, BoardMemberSchema)
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
  apps: [
    new GraphQLApp({
      schemaName: 'public'
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
