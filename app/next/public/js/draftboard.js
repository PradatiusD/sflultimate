(function () {
  const app = window.angular.module('draftboardApp', [])

  app.controller('PlayerTableController', function ($http, $scope) {
    const query = $http.get(window.sflUtils.addLeagueOverride('/players'))
    $scope.user = document.querySelector('#logged-in')
    let players = []
    $scope.players = []
    $scope.teams = []
    $scope.playerMap = {}

    $scope.modifyRoster = function (team, player, action) {
      const teamPlayers = team.players
      const foundIndex = teamPlayers.indexOf(player._id)
      if (action === 'add' && foundIndex === -1) {
        teamPlayers.push(player._id)
      } else if (action === 'remove' && foundIndex > -1) {
        teamPlayers.splice(foundIndex, 1)
      }

      const payload = {
        team_id: team._id,
        players: teamPlayers
      }

      $http.put(window.sflUtils.addLeagueOverride('/players'), payload).then(function (response) {
        $scope.players = response.data.players
        $scope.teams = response.data.teams
        $scope.players.forEach(function (player) {
          player.url = window.sflUtils.buildPlayerUrl(player)
          $scope.playerMap[player._id] = player
        })
        $scope.sortByGenderThenSkill()
      })

    }

    $scope.showOnlyCaptains = function () {
      $scope.players = players.filter(function (player) {
        return player.wouldCaptain
      })
    }

    $scope.showOnlySponsors = function () {
      $scope.players = players.filter(function (player) {
        return player.wouldSponsor
      })
    }

    $scope.sortByGenderThenSkill = function () {
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
      participation: ['Participation %'],
      playersPerTeam: ['Number of Teams'],
      playersPerTeamWithAttendance: ['Number of Teams'],
      genderPerTeam: ['Number of Teams', 'Gender'],
      genderPerTeamWithAttendance: ['Number of Teams', 'Gender'],
      insuranceGroup: ['Age Range'],
      shirtSize: ['Shirt Size'],
      shirtSizeWithGender: ['Shirt Size', 'Gender'],
      teamNameAndColorWithShirtSize: ['Team Name', 'Team Color', 'Size'],
      teamColorAndNameWithShirtSizeAndGender: ['Team Name', 'Team Color', 'Size', 'Gender'],
      registeredOnDate: ['Date'],
      registeredOnWeekday: ['Weekday'],
      registeredAtHour: ['Hour']
    }

    $scope.keysForTotals = Object.keys($scope.columnsForTotals)

    query.success(function (response) {
      players = response.players
      $scope.teams = response.teams
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
        player.url = window.sflUtils.buildPlayerUrl(player)
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

          if (key === 'teamNameAndColorWithShirtSize') {
            if (player.team) {
              value = [
                player.team.name,
                player.team.color,
                player.shirtSize
              ].join(JOIN_CHAR)
            } else {
              value = [
                'No Team',
                'No Color',
                player.shirtSize
              ].join(JOIN_CHAR)
            }
          }

          if (key === 'registeredOnDate') {
            value = new Date(player.createdAt).toLocaleDateString('en-CA', {
              year: 'numeric',
              month: 'numeric',
              day: 'numeric'
            })
          }

          if (key === 'registeredOnWeekday') {
            value = new Date(player.createdAt).toLocaleString('en-US', { weekday: 'long' })
          }

          if (key === 'registeredAtHour') {
            value = new Date(player.createdAt).toLocaleTimeString(navigator.language, { hour: 'numeric', hour12: false })
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
        totals[key] = Object.keys(totals[key]).sort().reduce(function (obj, subKey) {
          obj[subKey] = totals[key][subKey]
          return obj
        }, {})
      }

      $scope.totals = totals

      $scope.players = players
      $scope.players.forEach(function (player) {
        $scope.playerMap[player._id] = player
      })
      $scope.sortByGenderThenSkill()
    })

    query.error(function (err) {
      window.alert('There was an issue connecting to database.')
      console.log(err)
    })
  })
})()
