(function () {
  const app = angular.module('StatSheetApp', [])
  app.controller('StatSheetController', function ($scope, $http) {
    // http://localhost:5000/sheets?is_tournament=true
    // http://localhost:5000/sheets?date=2022-10-11
    // http://localhost:5000/sheets?date=2022-10-11&editor=true

    const urlParams = new URLSearchParams(window.location.search)
    $scope.isTournament = urlParams.get('is_tournament')
    const forcedDate = urlParams.get('date')
    $scope.today = forcedDate ? new Date(urlParams.get('date') + 'T12:00:00.000Z') : new Date()
    $scope.editor = urlParams.get('editor')

    let teamsResponse
    let statsResponse
    $http.get(window.sflUtils.addLeagueOverride('/teams?f=json'))
      .then(function (response) {
        teamsResponse = response
        return $http.get(window.sflUtils.addLeagueOverride('/stats?f=json&raw=true'))
      }).then(function (response) {
        statsResponse = response
        return $http.get(window.sflUtils.addLeagueOverride('/schedule?f=json'))
      }).then(function (response) {
        const teamsData = teamsResponse.data
        const teams = teamsData.teams
        const validGameIDs = []
        const oneWeekFromNow = $scope.today.getTime() + (6 * 24 * 60 * 60 * 1000)
        const games = response.data.games.filter(function (game) {
          game.scheduledTime = new Date(game.scheduledTime)
          const gameIsToday = game.scheduledTime.toDateString() === $scope.today.toDateString()
          if (forcedDate) {
            if (gameIsToday) {
              validGameIDs.push(game._id)
            }
            return gameIsToday
          }
          return Date.now() <= game.scheduledTimeEpoch && game.scheduledTimeEpoch <= oneWeekFromNow
        })

        const playerMap = {}
        teamsData.players.forEach(function (player) {
          playerMap[player._id] = player
        })

        const statsMap = {}
        statsResponse.data.items.forEach(function (statEntry) {
          if (validGameIDs.indexOf(statEntry.game) > -1) {
            if (!statsMap[statEntry.game]) {
              statsMap[statEntry.game] = {}
            }
            statsMap[statEntry.game][statEntry.player] = statEntry
          }
        })

        // Now for each game find all the players and their stats
        games.forEach(function (game) {
          if (!statsMap[game._id]) {
            statsMap[game._id] = {}
          }
          // find all the players in the game
          ['awayTeam', 'homeTeam'].forEach(function (teamKey) {
            const teamId = game[teamKey]
            const team = teamsData.teams.find(function (t) {
              return t._id === teamId
            })
            team.players.forEach(function (playerId) {
              if (!statsMap[game._id][playerId]) {
                statsMap[game._id][playerId] = {
                  pointsPlayed: 0,
                  defenses: 0,
                  scores: 0,
                  assists: 0,
                  attended: false
                }
              }
            })
          })
        })

        $scope.statsMap = statsMap

        const teamMap = {}
        teams.forEach(function (team) {
          teamMap[team._id] = team
          team.players = team.players.map(function (playerId) {
            return playerMap[playerId]
          })
        })

        $scope.teamMap = teamMap
        $scope.games = games.map(function (game) {
          game.teams = [
            {
              currentTeam: teamMap[game.homeTeam],
              opponent: teamMap[game.awayTeam]
            },
            {
              currentTeam: teamMap[game.awayTeam],
              opponent: teamMap[game.homeTeam]
            }
          ]
          return game
        })

        console.log($scope.games)

        $scope.handleSave = function (game, team) {
          const payload = {
            items: team.players.map(function (player) {
              const stats = Object.assign({}, statsMap[game._id][player._id])
              stats.game = game._id
              stats.player = player._id
              return stats
            })
          }
          $http.post('/stats', payload).then(function () {
            alert('Your data was saved for ' + team.name)
          }).catch(function () {
            alert('There was an error saving for ' + team.name)
          })
        }

        $scope.teams = teams
      })
  })
})()
