(function () {

var app = angular.module("scheduleApp", []);

app.controller("ScheduleViewController",function ($http, $scope, $filter) {

  $scope.games  = [];
  $scope.teams  = [];
  $scope.standings = {};

  $scope.forfeits = {
    Green: ["White"],
    Yellow: ["White"]
  };

  // Today plus one day of separation
  var dayInMilliseconds = 1000 * 60 * 60 * 24;
  $scope.today = new Date().getTime() - dayInMilliseconds;

  $scope.colorFilter = function (item) {
    return item;
  };

  $scope.filterFor = function (color) {

    $scope.colorFilter = function (game) {

      if (game.away === color || game.home === color) {

        if (game.away === color) {
          var home      = game.home;
          var homeScore = game.homeScore;

          var away      = game.away;
          var awayScore = game.awayScore;

          game.home = away;
          game.homeScore = awayScore;

          game.away = home;
          game.awayScore = homeScore;
        }

        if (game.home === color) {
          return true;
        }
      }
    }
  };

  var query = $http.get("/schedule?f=json");

  query.success(function (games) {

    $scope.games = games.map(function (game) {

      game.date      = new Date(game.date);
      game.timestamp = game.date.getTime();
      return game;
    });

    var teams = [];

    games.forEach(function (game) {
      if (teams.indexOf(game.home) === -1) {
        teams.push(game.home);
      }
    });

    $scope.teams = teams;

      
    var queryStats = $http.get("/stats.csv");
    queryStats.success(function (stats) {
      
      stats   = stats.split('\n');
      var headers = stats.splice(0,1)[0].split(',');

      var playedGames = headers.filter(function (d) {
        return d.toLowerCase().indexOf('scores') > -1;
      });


      stats = stats.map(function (stat, i) {

        var o = {};
        stat  = stat.split(',');

        stat.forEach(function (d, i) {
          o[headers[i]] = d;            
        });

        return o;
      });

      var scores = {};

      stats = stats.forEach(function (stat) {

        var statColor = stat["Team Color"];

        if (!scores[statColor]) {
          scores[statColor] = {};
        }

        playedGames.forEach(function (playedGame) {

          if (!scores[statColor][playedGame]) {
            scores[statColor][playedGame] = 0;
          }

          var points = stat[playedGame].length > 0 ? parseInt(stat[playedGame]): 0;
          scores[statColor][playedGame] += points;
        });
      });


      $scope.games = $scope.games.map(function (game) {

        var date = $filter('date')(game.date, 'MM/dd/yy');

        game.homeScore = scores[game.home][date +" Scores"];  
        game.awayScore = scores[game.away][date +" Scores"];

        // add to team if home color is greater than away color
        if (!$scope.standings[game.away]) {
          $scope.standings[game.away] = {
            wins: 0,
            losses: 0,
            pointDiff: 0
          };
        }

        if (!$scope.standings[game.home]) {
          $scope.standings[game.home] = {
            wins: 0,
            losses: 0,
            pointDiff: 0
          };        
        }

        if (game.homeScore > 0 && game.awayScore > 0) {

          var diff = game.homeScore - game.awayScore;

          var homeWon     = diff > 0;

          var victorColor = homeWon ? game.home : game.away;
          var loserColor  = homeWon ? game.away : game.home;

          var victorScore = homeWon ? game.homeScore : game.awayScore;
          var loserScore  = homeWon ? game.awayScore : game.homeScore;

          $scope.standings[victorColor].wins  += 1;
          $scope.standings[loserColor].losses += 1;

          var pointDiff = victorScore - loserScore;

          $scope.standings[victorColor].pointDiff += pointDiff;
          $scope.standings[loserColor].pointDiff  -= pointDiff;
        }

        return game;
      });

      for (var k in $scope.forfeits) {
        for (var i = 0; i < $scope.forfeits[k].length; i++) {
          var forfeitVictor = $scope.forfeits[k][i];
          var forfeitLoser  = k;

          $scope.standings[forfeitVictor].wins       += 1;
          $scope.standings[forfeitVictor].pointDiff  += 7;
          $scope.standings[forfeitLoser].losses      += 1;
          $scope.standings[forfeitLoser].pointDiff   -= 7;
        }
      }

      console.log(JSON.stringify($scope.standings, null, 2));
    });
  });

  query.error(function (err) {
    console.log(err);
  });

});

})();