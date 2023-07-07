const keystone = require('keystone')
const BoardMember = keystone.list('BoardMember')
const BoardPosition = keystone.list('BoardPosition')

module.exports = async function (req, res) {
  const view = new keystone.View(req, res)
  const locals = res.locals

  locals.boardMembers = await BoardMember.model.find({}).sort({ order: 1 }).lean().exec()

  const links = [
    {
      url: 'https://forms.gle/L9yK9o8p9gG2Cue66',
      label: 'Apply'
    }
  ]

  const positions = await BoardPosition.model.find({}).sort({ order: 1 }).populate('assigned').lean().exec()

  locals.positions = positions.map((item) => {
    item.links = links
    return item
  })

  locals.boardMembers.map((item) => {
    item.links = []
    return item
  })

  view.render('board')
}
