const keystone = require('keystone')
const Events = keystone.list('Event')

module.exports = async function (req, res) {
  const view = new keystone.View(req, res)
  const events = await Events.model.find({}).sort({ startTime: 1 }).lean().exec()
  res.locals.events = events.map(function (event) {
    event.links = []
    if (event.moreInformationUrl) {
      event.links.push({
        label: 'More Information',
        url: event.moreInformationUrl
      })
    }
    const now = Date.now()
    event.active = now < new Date(event.endTime).getTime()
    event.startTimeFormatted = new Date(event.startTime).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit',
      day: 'numeric',
      timeZone: 'America/New_York'
    })

    return event
  })

  view.render('events')
}
