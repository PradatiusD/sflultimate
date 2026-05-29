import { randomBytes } from 'node:crypto'

import { createAuth } from '@keystone-6/auth'
import { statelessSessions } from '@keystone-6/core/session'

const sessionSecret = process.env.SESSION_SECRET || randomBytes(32).toString('hex')

const { withAuth } = createAuth({
  listKey: 'User',
  identityField: 'email',
  secretField: 'password',
  sessionData: 'id firstName lastName email',
  initFirstItem: {
    fields: ['firstName', 'lastName', 'email', 'password'],
  },
})

const session = statelessSessions({
  maxAge: 60 * 60 * 24 * 30,
  secret: sessionSecret,
})

export { session, withAuth }
