const keystone = require('keystone')
const ClubTeams = keystone.list('ClubTeam')

module.exports = async function (req, res) {
  const view = new keystone.View(req, res)
  const locals = res.locals
  locals.clubTeams = await ClubTeams.model.find({}).sort({ order: 1 }).lean().exec()

  locals.clubTeams = locals.clubTeams.map(function (team) {
    team.links = []
    for (const key in team) {
      if (key.includes('Url')) {
        const label = key
          .replace('Url', '')
          .replace('Page', '')
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, function (str) {
            return str.toUpperCase()
          })

        team.links.push({
          label,
          url: team[key]
        })
      }
    }
    return team
  })

  view.render('club-teams')
}
