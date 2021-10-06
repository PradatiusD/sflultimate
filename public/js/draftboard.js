(function () {
  const app = window.angular.module('draftboardApp', [])

  app.controller('PlayerTableController', function ($http, $scope) {
    const query = $http.get('/players?registered=true')

    query.success(function (players) {
      const totals = {}
      $scope.keysForTotals = [
        'gender', 'shirtSize', 'shirtSizeWithGender', 'teamColorAndNameWithShirtSizeAndGender', 'participation', 'insuranceGroup']
      players.forEach(function (player) {
        $scope.keysForTotals.forEach(function (key) {
          if (!totals[key]) {
            totals[key] = {}
          }
          const totalKey = totals[key]
          if (key === 'shirtSizeWithGender') {
            player[key] = [player.shirtSize, player.gender].join('-')
          }

          if (key === 'teamColorAndNameWithShirtSizeAndGender') {
            player[key] = [player.team.name, player.team.color, player.shirtSize, player.gender].join('-')
          }

          if (key === 'insuranceGroup') {
            const age = player.age
            // <12 13-15 16-19 20+
            if (age <= 12) {
              player[key] = '12 and under'
            } else if (age <= 15) {
              player[key] = '13-15'
            } else if (age <= 19) {
              player[key] = '16-19'
            } else {
              player[key] = '20+'
            }
          }

          if (!totalKey[player[key]]) {
            totalKey[player[key]] = 0
          }
          totalKey[player[key]]++
        })
      })

      for (const key in totals) {
        totals[key] = Object.keys(totals[key]).sort().reduce(
          (obj, subKey) => {
            obj[subKey] = totals[key][subKey]
            return obj
          },
          {}
        )
      }

      $scope.totals = totals

      $scope.players = players.sort(function (a, b) {
        const aGender = a.gender === 'Female' ? 1 : 0
        const bGender = b.gender === 'Female' ? 1 : 0

        const genderDiff = bGender - aGender

        if (genderDiff === 0) {
          return b.skillLevel - a.skillLevel
        }

        return bGender - aGender
      })
    })

    query.error(function (err) {
      window.alert('There was an issue connecting to database.')
      console.log(err)
    })
  })
})()
