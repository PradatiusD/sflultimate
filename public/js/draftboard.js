(function () {
  const app = window.angular.module('draftboardApp', [])

  app.controller('PlayerTableController', function ($http, $scope) {
    const query = $http.get('/players?registered=true')
    $scope.players = []

    $scope.sortByGenderThenSkill = function (players) {
      $scope.players.sort(function (a, b) {
        const aGender = a.gender === 'Female' ? 1 : 0
        const bGender = b.gender === 'Female' ? 1 : 0

        const genderDiff = bGender - aGender

        if (genderDiff === 0) {
          return b.skillLevel - a.skillLevel
        }

        return bGender - aGender
      })
    }

    $scope.sortPlayersByRecency = function () {
      $scope.players.sort(function (a, b) {
        return b.createdAt.localeCompare(a.createdAt)
      })
    }

    $scope.formatDate = function (date) {
      return new Date(date).toLocaleString()
    }

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

    $scope.columnsForTotals = {
      gender: ['Gender'],
      shirtSize: ['Shirt Size'],
      shirtSizeWithGender: ['Shirt Size', 'Gender'],
      teamColorAndNameWithShirtSizeAndGender: ['Team Name', 'Team Color', 'Size', 'Gender'],
      participation: ['Participation %'],
      insuranceGroup: ['Age Range'],
      playersPerTeam: ['Number of Teams'],
      playersPerTeamWithAttendance: ['Number of Teams'],
      genderPerTeam: ['Number of Teams', 'Gender'],
      genderPerTeamWithAttendance: ['Number of Teams', 'Gender']
    }

    $scope.keysForTotals = Object.keys($scope.columnsForTotals)

    query.success(function (players) {
      const totals = {
        playersPerTeam: {},
        playersPerTeamWithAttendance: {},
        genderPerTeam: {},
        genderPerTeamWithAttendance: {}
      }

      const teamSizes = [4, 5, 6, 7, 8]
      for (const countKey in totals) {
        teamSizes.forEach(function (teamsAmount) {
          if (!countKey.startsWith('gender')) {
            totals[countKey][teamsAmount] = 0
          }
        })
      }

      const JOIN_CHAR = '|'
      players.forEach(function (player) {
        teamSizes.forEach(function (teamsAmount) {
          const perTeamScore = 1 / teamsAmount
          const perTeamScoreWeightedWithParticipation = (perTeamScore * parseInt(player.participation) / 100)
          const teamNumberAndGenderKey = [teamsAmount, player.gender].join(JOIN_CHAR)

          totals.playersPerTeam[teamsAmount] += perTeamScore
          totals.playersPerTeamWithAttendance[teamsAmount] += perTeamScoreWeightedWithParticipation

          if (!totals.genderPerTeam[teamNumberAndGenderKey]) {
            totals.genderPerTeam[teamNumberAndGenderKey] = 0
          }

          if (!totals.genderPerTeamWithAttendance[teamNumberAndGenderKey]) {
            totals.genderPerTeamWithAttendance[teamNumberAndGenderKey] = 0
          }

          totals.genderPerTeam[teamNumberAndGenderKey] += perTeamScore
          totals.genderPerTeamWithAttendance[teamNumberAndGenderKey] += perTeamScoreWeightedWithParticipation
        })

        $scope.keysForTotals.forEach(function (key) {
          if (!totals[key]) {
            totals[key] = {}
          }
          const totalKey = totals[key]
          let value = player[key]
          if (key === 'shirtSizeWithGender') {
            value = [
              player.shirtSize,
              player.gender
            ].join(JOIN_CHAR)
          }

          if (key === 'teamColorAndNameWithShirtSizeAndGender') {
            if (player.team) {
              value = [
                player.team.name,
                player.team.color,
                player.shirtSize,
                player.gender
              ].join(JOIN_CHAR)
            } else {
              value = [
                'No Team',
                'No Color',
                player.shirtSize,
                player.gender
              ].join(JOIN_CHAR)
            }
          }

          if (key === 'insuranceGroup') {
            const age = player.age
            // <12 13-15 16-19 20+
            if (age <= 12) {
              value = '12 and under'
            } else if (age <= 15) {
              value = '13-15'
            } else if (age <= 19) {
              value = '16-19'
            } else {
              value = '20+'
            }
          }

          if (value) {
            if (!totalKey[value]) {
              totalKey[value] = 0
            }
            totalKey[value]++
          }
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

      $scope.players = players
      $scope.sortByGenderThenSkill()
    })

    query.error(function (err) {
      window.alert('There was an issue connecting to database.')
      console.log(err)
    })
  })
})()
