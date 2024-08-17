require('dotenv').config({ path: './../.env' })
const { GraphQLApp } = require('@keystonejs/app-graphql')
const { AdminUIApp } = require('@keystonejs/app-admin-ui')
const PROJECT_NAME = 'SFLUltimate'
const keystone = require('./keystone')
// Import lists
const BoardMemberSchema = require('./lists/BoardMember')
keystone.createList('BoardMember', BoardMemberSchema)

const BoardPositionSchema = require('./lists/BoardPosition')
keystone.createList('BoardPosition', BoardPositionSchema)

module.exports = {
  keystone,
  apps: [
    new GraphQLApp(),
    new AdminUIApp({ name: PROJECT_NAME, enableDefaultRoute: true })]
}
