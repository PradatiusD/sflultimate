(function () {
  const app = angular.module('TeamApp', [])

  function createShirtList (teams) {
    const jerseys = {}

    teams.forEach(function (team) {
      const color = team.color

      if (!jerseys[color]) { jerseys[color] = {} }

      team.players.forEach(function (player) {
        if (!jerseys[color][player.shirtSize]) { jerseys[color][player.shirtSize] = 0 }

        jerseys[color][player.shirtSize]++
      })
    })

    let orders = []

    for (const color in jerseys) {
      const sizes = jerseys[color]

      const order = Object.keys(sizes).map(function (size) {
        return {
          size: size,
          count: sizes[size],
          color: color
        }
      })

      orders = orders.concat(order)
    }

    console.log(JSON.stringify(orders, null, 2))
  }

  function createEmailList (teams) {
    const messages = []

    teams.forEach(function (team) {
      let msg = 'To: '

      const captainIds = []

      team.captains.forEach(function (captain) {
        msg += captain.email + ', '
        captainIds.push(captain._id)
      })

      msg += '\n\n'

      team.players.forEach(function (player) {
        if (captainIds.indexOf(player._id) === -1) {
          msg += player.name.first + ' ' + player.name.last + ' (' + player.email + ')\n'
        }
      })

      messages.push(msg)
    })

    return messages.join('\n')
  }

  function createStatsList (teams) {
    const headers = ['Player ID', 'Team Color', 'First Name', 'Last Name', 'Gender']
    let csv = headers.join('\t') + '\n'

    teams.forEach(function (team) {
      team.players.forEach(function (player) {
        const row = [player._id, team.color, player.name.first, player.name.last, player.gender]
        csv += row.join('\t') + '\n'
      })
    })

    console.log(csv)
  }

  function createShirtDistributionList (teams) {
    let players = []
    teams.forEach(function (team) {
      const playersWithColor = team.players.map(function (player) {
        player.color = team.color
        return player
      })
      players = players.concat(playersWithColor)
    })

    players = players.sort(function (a, b) {
      if (a.color < b.color) {
        return -1
      }

      if (a.color > b.color) {
        return 1
      }

      const aName = a.name.first + '' + a.name.last
      const bName = b.name.first + '' + b.name.last

      if (aName < bName) { return -1 }
      if (aName > bName) { return 1 }

      return 0
    })

    players = players.map(function (p) {
      return {
        color: p.color,
        name: p.name.first + ' ' + p.name.last,
        size: p.shirtSize
      }
    })

    console.log(JSON.stringify(players, null, 2))
  }

  app.controller('TeamListController', function ($http, $scope) {
    $scope.getTeamsAndPlayers = function () {
      const query = $http.get(window.sflUtils.addLeagueOverride('/teams?f=json'))
      query.then(function (response) {
        const data = response.data
        let teams = data.teams
        const players = data.players

        function matchToPlayerById (playerId) {
          for (let i = 0; i < players.length; i++) {
            if (players[i]._id === playerId) {
              return players[i]
            }
          }
        }

        teams = teams.map(function (team) {
          team.captains = team.captains.map(matchToPlayerById)
          team.players = team.players.map(matchToPlayerById)
          team.players.sort((a, b) => {
            const compareGender = a.gender.localeCompare(b.gender)
            if (compareGender !== 0) {
              return compareGender
            }
            return (a.name.first + ' ' + a.name.last).localeCompare(b.name.first + ' ' + b.name.last)
          })

          team.menTotal = 0
          team.womenTotal = 0

          team.players.forEach(function (player) {
            if (player.gender === 'Male') { team.menTotal++ }
            if (player.gender === 'Female') { team.womenTotal++ }
          })

          return team
        })

        $scope.teams = teams
        $scope.league = data.league

        // console.log(createShirtList(teams));
        // console.log(createEmailList(teams));
        // console.log(createStatsList(teams));
        // console.log(createShirtDistributionList(teams));
      }, function (err) {
        alert('There was an issue connecting to database.')
        console.log(err)
      })
    }
  })
})()
