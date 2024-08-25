require('dotenv').config({ path: './../.env' })
const { GraphQLApp } = require('@keystonejs/app-graphql')
const { AdminUIApp } = require('@keystonejs/app-admin-ui')
const { NextApp } = require('@keystonejs/app-next')
const PROJECT_NAME = 'SFLUltimate'
const keystone = require('./keystone')

const migratedLists = [
  'BoardMember',
  'BoardPosition',
  'ClubTeam',
  'Event',
  'League',
  'Player',
  'Team'
]

for (const listName of migratedLists) {
  const BoardMemberSchema = require('./lists/' + listName)
  keystone.createList(listName, BoardMemberSchema)
}

module.exports = {
  keystone,
  apps: [
    new GraphQLApp(),
    new AdminUIApp({
      name: PROJECT_NAME,
      enableDefaultRoute: false
    }),
    new NextApp({ dir: 'next' })
  ]
}
