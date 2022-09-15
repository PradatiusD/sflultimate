(function () {
  const app = angular.module('StatsApp', [])

  app.controller('StatsViewController', function ($http, $scope) {
    const query = $http.get(window.sflUtils.addLeagueOverride('/stats?f=json'))

    query.then(function (response) {
      let statEntries = response.data.stats

      const playerIDMap = {}
      for (const player of response.data.players) {
        playerIDMap[player._id] = player
      }

      const playerToTeamColorMap = {}
      for (const team of response.data.teams) {
        const ids = team.captains.concat(team.players)
        for (const id of ids) {
          playerToTeamColorMap[id] = team.color
        }
      }

      statEntries = statEntries.map(function (entry) {
        entry.overall = entry.assists + entry.scores + entry.defenses
        entry.teamColor = playerToTeamColorMap[entry.player]
        Object.assign(entry, playerIDMap[entry.player])
        return entry
      })

      statEntries = _.sortBy(statEntries, function (d) {
        return d.overall
      }).reverse()

      const awards = {
        Male: {},
        Female: {}
      }

      const keys = ['assists', 'scores', 'defenses', 'pointsPlayed', 'overall']
      $scope.keysToCompare = keys

      keys.forEach(function (key) {
        awards.Female[key] = 0
        awards.Male[key] = 0
      })

      for (let i = 0; i < statEntries.length; i++) {
        const p = statEntries[i]
        const gender = p.gender

        if (gender === 'Female') {
          for (let j = 0; j < keys.length; j++) {
            const key = keys[j]
            if (p[key] > awards.Female[key]) {
              awards.Female[key] = p[key]
            }
          }
        }

        if (gender === 'Male') {
          for (let j = 0; j < keys.length; j++) {
            const key = keys[j]
            if (p[key] > awards.Male[key]) {
              awards.Male[key] = p[key]
            }
          }
        }
      }

      $scope.leaderboard = statEntries.splice(0, 10)
      $scope.contenders = statEntries
      $scope.awards = awards
      console.log($scope.awards)
    }).catch(function (e) {
      console.log(e)
      alert('There was an error calculating stats.')
    })
  })
})()
