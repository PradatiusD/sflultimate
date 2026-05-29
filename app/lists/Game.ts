import { list } from '@keystone-6/core'
import { allowAll } from '@keystone-6/core/access'
import { checkbox, file, integer, relationship, text, timestamp } from '@keystone-6/core/fields'

export default list({
  access: allowAll,
  fields: {
    name: text(),
    league: relationship({ ref: 'League' }),
    scheduledTime: timestamp(),
    homeTeam: relationship({ ref: 'Team' }),
    awayTeam: relationship({ ref: 'Team' }),
    homeTeamScore: integer(),
    homeTeamForfeit: checkbox({ defaultValue: false }),
    awayTeamScore: integer(),
    awayTeamForfeit: checkbox({ defaultValue: false }),
    location: relationship({ ref: 'Location' }),
    showNameOnSchedule: checkbox({ defaultValue: false }),
    homeTeamStatSheet: file({ storage: 'local_files' }),
    awayTeamStatSheet: file({ storage: 'local_files' }),
  },
  ui: {
    labelField: 'name',
    listView: {
      initialColumns: ['league', 'homeTeam', 'homeTeamScore', 'awayTeam', 'awayTeamScore', 'scheduledTime', 'location'],
    },
  },
})
