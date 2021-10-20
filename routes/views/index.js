const keystone = require('keystone')
const Game = keystone.list('Game')
const Team = keystone.list('Team')

exports = module.exports = async function (req, res) {
  const view = new keystone.View(req, res)
  const locals = res.locals

  // locals.section is used to set the currently selected
  // item in the header navigation.
  locals.section = 'home'

  const games = await Game.model.find({
    league: res.locals.league._id,
    homeTeamScore: {
      $exists: true
    },
    awayTeamScore: {
      $exists: true
    }
  }).lean()

  const standingsMap = {}

  const teams = await Team.model.find({
    league: res.locals.league._id
  }).lean().exec()

  const teamsMap = {}
  for (const team of teams) {
    teamsMap[team._id.valueOf()] = team.name
  }
  for (const game of games) {
    const homeTeam = {
      id: game.homeTeam.valueOf(),
      score: game.homeTeamScore
    }

    const awayTeam = {
      id: game.awayTeam.valueOf(),
      score: game.awayTeamScore
    }

    let winner
    let loser
    const pointDiff = Math.abs(homeTeam.score - awayTeam.score)
    if (homeTeam.score > awayTeam.score) {
      winner = homeTeam
      loser = awayTeam
    } else {
      winner = awayTeam
      loser = homeTeam
    }

    if (!standingsMap[winner.id]) {
      standingsMap[winner.id] = {
        name: teamsMap[winner.id],
        wins: 0,
        losses: 0,
        pointDiff: 0
      }
    }
    standingsMap[winner.id].wins++
    standingsMap[winner.id].pointDiff += pointDiff
    if (!standingsMap[loser.id]) {
      standingsMap[loser.id] = {
        name: teamsMap[loser.id],
        wins: 0,
        losses: 0,
        pointDiff: 0
      }
    }
    standingsMap[loser.id].losses++
    standingsMap[loser.id].pointDiff -= pointDiff
  }

  const standings = []
  for (const team in standingsMap) {
    const teamEntry = standingsMap[team]
    standings.push(teamEntry)
  }

  locals.hallOfFameImages = [
    'league-champions-2017-spring.jpg',
    'league-champions-2016-fall.jpg',
    'league-champions-2016-spring.jpg',
    'league-champions-2015-fall.jpg',
    'league-champions-2015-spring.jpg',
    'league-medals-2015-spring.jpg',
    'league-champions-2014-fall.jpg',
    'league-champions-2014-spring.jpg',
    'league-champions-2013-spring.jpg'
  ]

  if (req.query.f === 'json') {
    res.json(standings)
    return
  }

  locals.standings = standings

  // Render the view
  view.render('index')
}
