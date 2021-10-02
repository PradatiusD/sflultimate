(function () {
  const app = window.angular.module('draftboardApp', [])

  app.controller('PlayerTableController', function ($http, $scope) {
    const query = $http.get('/players?registered=true')

    query.success(function (players) {
      $scope.totals = {}
      $scope.keysForTotals = ['gender', 'shirtSize', 'participation']
      players.forEach(function (player) {
        $scope.keysForTotals.forEach(function (key) {
          if (!$scope.totals[key]) {
            $scope.totals[key] = {}
          }
          if (!$scope.totals[key][player[key]]) {
            $scope.totals[key][player[key]] = 0
          }
          $scope.totals[key][player[key]]++
        })
      })

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
