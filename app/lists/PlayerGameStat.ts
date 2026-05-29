import { list } from '@keystone-6/core'
import { allowAll } from '@keystone-6/core/access'
import { checkbox, integer, relationship, timestamp } from '@keystone-6/core/fields'

export default list({
  access: allowAll,
  fields: {
    createdAt: timestamp({ defaultValue: { kind: 'now' }, validation: { isRequired: true } }),
    updatedAt: timestamp({ db: { updatedAt: true }, validation: { isRequired: true } }),
    player: relationship({ ref: 'Player' }),
    game: relationship({ ref: 'Game' }),
    assists: integer(),
    scores: integer(),
    defenses: integer(),
    throwaways: integer(),
    drops: integer(),
    pointsPlayed: integer(),
    attended: checkbox(),
  },
  ui: {
    listView: {
      initialColumns: ['player', 'game', 'assists', 'scores', 'defenses', 'pointsPlayed'],
    },
  },
})
