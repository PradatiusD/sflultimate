(function () {
  var app = angular.module('StatSheetApp', [])

  app.controller('StatSheetController', function ($scope, $http) {
    var url = '/teams?f=json'
    var query = $http.get(url)

    query.then(function (response) {
      var data = response.data
      var teams = data.teams
      var players = data.players

      teams.forEach(function (team) {
        team.players = team.players.map(function (playerId) {
          for (var i = 0; i < players.length; i++) {
            if (players[i]._id === playerId) {
              playerId = players[i]
              break
            }
          }
          return playerId
        })
      })

      $scope.teams = teams
    })
  })
})()
