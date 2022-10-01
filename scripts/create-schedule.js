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

function insertSchedule () {
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
  const league = db.leagues.find({ isActive: true }).next()._id
  const teams = db.teams.find({ league: league })
  const ONE_WEEK = 7 * 24 * 60 * 60 * 1000
  function buildScheduleLoopSince (startDate, endDate) {
    for (const key in teamScheduleForSix) {
      const gameDate = new Date(new Date(startDate).getTime() + key * ONE_WEEK)
      if (endDate && gameDate > new Date(endDate).getTime()) {
        return
      }
      teamScheduleForSix[key].matchups.forEach(function (matchup) {
        const team1 = teams[parseInt(matchup.split('vs')[0]) - 1]
        const team2 = teams[parseInt(matchup.split('vs')[1]) - 1]
        const data = {
          location: ObjectId('61829b0cc4b6e2000457897f'),
          homeTeam: team1._id,
          awayTeam: team2._id,
          scheduledTime: gameDate,
          league: league,
          name: gameDate.toLocaleDateString('en-CA').replace(/-/g, '') + '_' + team1.name + '@' + team2.name,
          awayTeamScore: 0,
          homeTeamScore: 0
        }
        printjson(data)
        db.games.insert(data)
      })
    }
  }
  buildScheduleLoopSince('2022-10-05T00:00:00Z')
  buildScheduleLoopSince('2022-11-09T00:00:00Z', '2022-11-27T00:00:00Z')
}

insertSchedule()
