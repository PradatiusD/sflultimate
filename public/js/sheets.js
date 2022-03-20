(function () {
  var app = angular.module('StatSheetApp', [])

  app.controller('StatSheetController', function ($scope, $http) {
    let teamsResponse
    let scheduleResponse
    $http.get('/teams?f=json')
      .then(function (response) {
        teamsResponse = response
        return $http.get('/schedule?f=json')
      }).then(function (response) {
        scheduleResponse = response
        const teamsData = teamsResponse.data
        const teams = teamsData.teams
        const players = teamsData.players

        const scheduleMap = {}
        scheduleResponse.data.games.forEach(function (game) {
          const isGameToday = new Date(game.scheduledTime).toDateString() === new Date().toDateString()
          if (!isGameToday) {
            return
          }
          game.scheduledTime = new Date(game.scheduledTime)
          scheduleMap[game.homeTeam] = game
          scheduleMap[game.awayTeam] = game
        })

        $scope.teamMap = {}

        teams.forEach(function (team) {
          $scope.teamMap[team._id] = team.name
          team.game = scheduleMap[team._id]
          team.players = team.players.map(function (playerId) {
            for (let i = 0; i < players.length; i++) {
              if (players[i]._id === playerId) {
                playerId = players[i]
                break
              }
            }
            return playerId
          })
        })

        console.log(teams)
        $scope.teams = teams
      })
  })
})()
