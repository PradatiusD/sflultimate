(function () {
  var app = window.angular.module('draftboardApp', [])

  app.controller('PlayerTableController', function ($http, $scope) {
    var query = $http.get('/players?registered=true')

    query.success(function (players) {
      $scope.players = players.sort(function (a, b) {
        var aGender = a.gender === 'Female' ? 1 : 0
        var bGender = b.gender === 'Female' ? 1 : 0

        var genderDiff = bGender - aGender

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
