/**
 * mongo sflultimate scripts/create-schedule.js
 */

function attemptToBuildSchedule () {
  const teams = []
  const teamCount = 6
  for (let i = 1; i <= teamCount; i++) {
    teams.push(i)
  }
  const matchups = []
  for (let i = 0; i < teams.length; i++) {
    for (let j = 0; j < teams.length; j++) {
      if (i !== j) {
        const matchup = [teams[i], teams[j]].sort().join('vs')
        if (!matchups.includes(matchup)) {
          matchups.push(matchup)
        }
      }
    }
  }
  console.log(matchups)
  const weeks = {}
  const gamesPerWeek = (teamCount / 2)
  const weekCount = matchups.length / gamesPerWeek
  for (let i = 0; i < weekCount; i++) {
    weeks[i] = {
      matchups: [],
      teamsPlayed: []
    }
    let tries = 0
    while (weeks[i].matchups.length < gamesPerWeek && tries < matchups.length * 2) {
      tries++
      const matchup = matchups.shift()
      const split = matchup.split('vs')
      const homeTeam = parseInt(split[0])
      const awayTeam = parseInt(split[1])
      if (weeks[i].teamsPlayed.includes(homeTeam) || weeks[i].teamsPlayed.includes(awayTeam)) {
        matchups.push(matchup)
        continue
      }
      weeks[i].teamsPlayed.push(homeTeam, awayTeam)
      weeks[i].matchups.push(matchup)
    }
  }
  console.log(JSON.stringify({
    matchups, weeks
  }, null, 2))
}

/**
 *
 * @param {object} options
 * @param {string[]} options.locations
 */
function insertSchedule (options) {
  const teamScheduleForSix = {
    0: {
      matchups: [
        '1vs2',
        '3vs4',
        '5vs6'
      ]
    },
    1: {
      matchups: [
        '1vs3',
        '2vs5',
        '4vs6'
      ]
    },
    2: {
      matchups: [
        '4vs5',
        '1vs6',
        '2vs3'
      ]
    },
    3: {
      matchups: [
        '2vs4',
        '1vs5',
        '3vs6'
      ]
    },
    4: {
      matchups: [
        '2vs6',
        '1vs4',
        '3vs5'
      ]
    }
  }
  const league = db.leagues.find({ isActive: true }).next()
  printjson(league)
  const leaguId = league._id
  const teams = db.teams.find({ league: leaguId })
  const ONE_WEEK = 7 * 24 * 60 * 60 * 1000

  function buildScheduleLoopSince (startDate, endDate) {
    const teamScheduleKeys = Object.keys(teamScheduleForSix)
    let i = 0
    while (i < 100) {
      const key = teamScheduleKeys[i % teamScheduleKeys.length]
      let gameDate = new Date(new Date(startDate).getTime() + i * ONE_WEEK)
      const leagueEnded = endDate && gameDate > new Date(endDate).getTime()
      if (leagueEnded) {
        return
      }

      const skipDate = new Date(options.skipDate).toLocaleDateString('en-CA')
      if (gameDate.toLocaleDateString('en-CA') === skipDate) {
        i++
        continue
      }

      // if Daylight savings
      const isDaylightSavings = gameDate.getTimezoneOffset() > 240
      if (isDaylightSavings) {
        gameDate = new Date(gameDate.getTime() + 60 * 60 * 1000)
      }

      const matchups = teamScheduleForSix[key].matchups
      matchups.forEach(function (matchup, matchupIndex) {
        const team1 = teams[parseInt(matchup.split('vs')[0]) - 1]
        const team2 = teams[parseInt(matchup.split('vs')[1]) - 1]
        const game = {
          location: options.locations[matchupIndex % options.locations.length],
          homeTeam: team1._id,
          awayTeam: team2._id,
          scheduledTime: gameDate,
          league: leaguId,
          name: gameDate.toLocaleDateString('en-CA').replace(/-/g, '') + '_' + team1.name + '@' + team2.name,
          awayTeamScore: 0,
          homeTeamScore: 0,
          homeTeamForfeit: false,
          awayTeamForfeit: false
        }
        printjson(game)
        if (options.write) {
          db.games.insert(game)
        }
      })
      i++
    }
  }
  buildScheduleLoopSince(options.startDate, options.endDate)
}

const amelia = ['61829b0cc4b6e2000457897f']
const ives = ['6236877d28f3fe0004fc5f95']
const holiday = ['6416b3cfe511210002ed4795', '641ae1c2fb9ec80002096f85', '641ae1ccfb9ec80002096f86']
insertSchedule({
  locations: holiday,
  startDate: '2024-03-17T20:00:00Z',
  endDate: '2024-04-21T20:00:00Z',
  write: true,
  skipDate: '2024-03-31T08:00:00.000Z'
})
