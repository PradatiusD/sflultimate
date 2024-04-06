const keystone = require('keystone')
const ClubTeams = keystone.list('ClubTeam')

module.exports = async function (req, res) {
  const view = new keystone.View(req, res)
  const locals = res.locals
  locals.clubTeams = await ClubTeams.model.find({}).sort({ order: 1 }).lean().exec()

  locals.clubTeams = locals.clubTeams.map(function (team) {
    team.links = []
    for (const key in team) {
      const url = team[key]
      if (key.includes('Url') && url) {
        const label = key
          .replace('Url', '')
          .replace('Page', '')
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, function (str) {
            return str.toUpperCase()
          })

        const link = {
          label,
          url
        }

        team.links.push(link)
      }
    }
    return team
  })

  view.render('club-teams')
}
