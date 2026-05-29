import 'dotenv/config'

import { config } from '@keystone-6/core'

import { session, withAuth } from './auth'
import { lists } from './lists'

export default withAuth(
  config({
    db: {
      provider: 'sqlite',
      url: 'file:./keystone.db',
    },
    lists,
    session,
    storage: {
      local_files: {
        kind: 'local',
        type: 'file',
        generateUrl: path => `/files${path}`,
        serverRoute: {
          path: '/files',
        },
        storagePath: 'files',
      },
    },
  })
)
