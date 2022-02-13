(function () {
  const app = window.angular.module('draftboardApp', [])

  app.controller('PlayerTableController', function ($http, $scope) {
    const query = $http.get('/players?registered=true')

    $scope.formatMapName = function (text) {
      let finalString = ''
      for (let i = 0; i < text.length; i++) {
        const char = text[i]
        if (i === 0) {
          finalString += char.toUpperCase()
        } else if (char.toUpperCase() === char) {
          finalString += ' ' + char.toLowerCase()
        } else {
          finalString += char
        }
      }
      return finalString
    }

    $scope.getBadgeStyle = function (player) {
      if (!player || !player.team) {
        return {}
      }

      return {
        'background-color': player.team && player.team.color ? player.team.color : 'white',
        color: player && player.team.color === '#ffffff' ? 'black' : 'black'
      }
    }

    $scope.keysForTotals = ['gender', 'shirtSize', 'shirtSizeWithGender', 'teamColorAndNameWithShirtSizeAndGender', 'participation', 'insuranceGroup']

    query.success(function (players) {
      const totals = {}

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
            if (player.team) {
              player[key] = [player.team.name, player.team.color, player.shirtSize, player.gender].join('-')
            } else {
              player[key] = ['No Team', 'No Color', player.shirtSize, player.gender].join('-')
            }
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
