(function () {
  var app = angular.module('scheduleApp', [])

  app.controller('ScheduleViewController', function ($http, $scope, $filter) {
    $scope.games = []
    $scope.teams = []
    $scope.standings = {}
    $scope.forfeits = {}

    // Today plus one day of separation
    var dayInMilliseconds = 1000 * 60 * 60 * 24
    $scope.today = new Date().getTime() - dayInMilliseconds

    $scope.colorFilter = function (item) {
      return item
    }

    $scope.filterScheduleFor = function (team) {
      $scope.colorFilter = function (game) {
        if (game.awayTeam._id === team._id || game.homeTeam._id === team._id) {
          return true
        }
      }
    }

    $http.get('/schedule?f=json').then(function (response) {
      $scope.teams = {}
      for (const team of response.data.teams) {
        $scope.teams[team._id] = team
      }
      $scope.locations = {}
      for (const location of response.data.locations) {
        $scope.locations[location._id] = location
      }

      $scope.games = response.data.games.map(function (game) {
        game.homeTeam = $scope.teams[game.homeTeam]
        game.awayTeam = $scope.teams[game.awayTeam]
        return game
      })

      return $http.get('/stats')
    }).then(function (response) {
      return
      var stats = response.data

      stats = stats.split('\n')
      var headers = stats.splice(0, 1)[0].split(',').map(function (column) {
        if (column.indexOf('/') === -1) return column

        var _date = column.match(/\d{1,}\/\d{1,}\/\d{1,}/)

        var date = _date[0].split('/').map(function (d) {
          if (d.length === 1) {
            return '0' + d
          }
          return d
        }).join('/')

        column = column.replace(_date, date)
        return column
      })

      var playedGames = headers.filter(function (d) {
        return d.toLowerCase().indexOf('s\'s') > -1
      })

      stats = stats.map(function (stat, i) {
        var o = {}
        stat = stat.split(',')

        stat.forEach(function (d, i) {
          o[headers[i]] = d
        })

        return o
      })

      var scores = {}

      stats.forEach(function (stat) {
        var teamColor = stat['Team Color']

        if (!scores[teamColor]) {
          scores[teamColor] = {}
        }

        playedGames.forEach(function (playedGame) {
          if (!scores[teamColor][playedGame]) {
            scores[teamColor][playedGame] = 0
          }

          var points = stat[playedGame].length > 0 ? parseInt(stat[playedGame]) : 0

          scores[teamColor][playedGame] += points
        })
      })

      $scope.games = $scope.games.map(function (game) {
        var date = $filter('date')(game.date, 'MM/dd/yy')

        game.homeScore = scores[game.home][date + " S's"]
        game.awayScore = scores[game.away][date + " S's"]

        // add to team if home color is greater than away color
        if (!$scope.standings[game.away]) {
          $scope.standings[game.away] = {
            wins: 0,
            losses: 0,
            pointDiff: 0
          }
        }

        if (!$scope.standings[game.home]) {
          $scope.standings[game.home] = {
            wins: 0,
            losses: 0,
            pointDiff: 0
          }
        }

        if (game.homeScore > 0 && game.awayScore > 0) {
          var diff = game.homeScore - game.awayScore

          var homeWon = diff > 0

          var victorColor = homeWon ? game.home : game.away
          var loserColor = homeWon ? game.away : game.home

          var victorScore = homeWon ? game.homeScore : game.awayScore
          var loserScore = homeWon ? game.awayScore : game.homeScore

          $scope.standings[victorColor].wins += 1
          $scope.standings[loserColor].losses += 1

          var pointDiff = victorScore - loserScore

          $scope.standings[victorColor].pointDiff += pointDiff
          $scope.standings[loserColor].pointDiff -= pointDiff
        }

        return game
      })

      for (var k in $scope.forfeits) {
        for (var i = 0; i < $scope.forfeits[k].length; i++) {
          var forfeitVictor = $scope.forfeits[k][i]
          var forfeitLoser = k

          $scope.standings[forfeitVictor].wins += 1
          $scope.standings[forfeitVictor].pointDiff += 7
          $scope.standings[forfeitLoser].losses += 1
          $scope.standings[forfeitLoser].pointDiff -= 7
        }
      }

      console.log(JSON.stringify($scope.standings, null, 2))

      $scope.standingsArr = []
      for (var o in $scope.standings) {
        $scope.standingsArr.push({
          color: o,
          wins: $scope.standings[o].wins,
          losses: $scope.standings[o].losses,
          pointDiff: $scope.standings[o].pointDiff
        })
      }

      $scope.standingsArr = $scope.standingsArr.sort(function (a, b) {
        if (a.wins > b.wins) return -1
        if (a.wins < b.wins) return 1

        if (a.pointDiff > b.pointDiff) return -1
        if (a.pointDiff < b.pointDiff) return 1
        return 0
      })
    }).catch(function (err) {
      console.log(err)
    })
  })
})()
