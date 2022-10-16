(function () {
  var app = angular.module('StatSheetApp', [])
  app.controller('StatSheetController', function ($scope, $http) {
    // http://localhost:5000/sheets?is_tournament=true
    // http://localhost:5000/sheets?date=2022-10-11
    // http://localhost:5000/sheets?date=2022-10-11&editor=true

    const urlParams = new URLSearchParams(window.location.search)
    $scope.isTournament = urlParams.get('is_tournament')
    $scope.today = urlParams.get('date') ? new Date(urlParams.get('date') + 'T12:00:00.000Z') : new Date()
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
        const games = response.data.games.filter(function (game) {
          game.scheduledTime = new Date(game.scheduledTime)
          const canBeShown = new Date(game.scheduledTime).toDateString() === $scope.today.toDateString()
          if (canBeShown) {
            validGameIDs.push(game._id)
          }
          return canBeShown
        })
        const playerMap = {}

        const statsMap = {}
        statsResponse.data.items.forEach(function (statEntry) {
          if (validGameIDs.indexOf(statEntry.game) > -1) {
            statsMap[statEntry.player] = statEntry
          }
        })

        teamsData.players.forEach(function (player) {
          player.stats = statsMap[player._id] || {
            pointsPlayed: 0,
            defenses: 0,
            scores: 0,
            assists: 0,
            attended: false
          }
          playerMap[player._id] = player
        })

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

        $scope.handleSave = function (game, team) {
          $http.post('/stats', {
            items: team.players.map(function (player) {
              const stats = player.stats
              stats.game = game._id
              stats.player = player._id
              return stats
            })
          }).then(function () {
            alert('Your data was saved for ' + team.name)
          }).catch(function () {
            alert('There was an error saving for ' + team.name)
          })
        }

        console.log(teams)
        $scope.teams = teams
      })
  })
})()
