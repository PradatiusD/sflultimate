#!/usr/bin/env node

require('dotenv').config()

const { execSync, spawnSync } = require('child_process')

const dbName = 'sflultimateV5'
const dumpCommand = process.env.DATABASE_DUMP_COMMAND

if (!dumpCommand) {
  console.error('DATABASE_DUMP_COMMAND is required')
  process.exit(1)
}

function run (command, args) {
  const result = spawnSync(command, args, { stdio: 'inherit' })

  if (result.error) {
    throw result.error
  }

  if (result.status !== 0) {
    process.exit(result.status || 1)
  }
}

execSync(dumpCommand, { stdio: 'inherit' })
run('mongo', [dbName, '--eval', 'printjson(db.dropDatabase())'])
run('mongorestore', ['--noIndexRestore', '-d', dbName, `dump/${dbName}/`])
