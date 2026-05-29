import { list } from '@keystone-6/core'
import { allowAll } from '@keystone-6/core/access'
import { file, integer, relationship, text } from '@keystone-6/core/fields'

export default list({
  access: allowAll,
  fields: {
    name: text({ validation: { isRequired: true }, isIndexed: true }),
    color: text(),
    captains: relationship({ ref: 'Player', many: true }),
    players: relationship({ ref: 'Player', many: true }),
    league: relationship({ ref: 'League' }),
    draftOrder: integer(),
    image: file({ storage: 'local_files' }),
  },
  ui: {
    labelField: 'name',
    listView: {
      initialColumns: ['name', 'league', 'captains', 'color', 'image'],
    },
  },
})
