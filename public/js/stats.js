(function () {

var app = angular.module('StatsApp', []);

app.controller('StatsViewController',function ($http, $scope) {

  var query = $http.get('/stats.csv');

  query.success(function (data) {

    var rows    = data.split('\n');
    var headers = rows.splice(0,1)[0].split(',');

    rows = rows.map(function (row) {

      row   = row.split(',');
      var o = {
        Assists: 0,
        Scores: 0,
        Defenses: 0
      };

      row.forEach(function (cell, i) {

        var column = headers[i];
        
        if (column) {

          var cellNum = parseInt(cell) || 0;

          if (column.indexOf('A\'s') > -1) {
            o.Assists  += cellNum;
          }

          if (column.indexOf('S\'s') > -1) {
            o.Scores   += cellNum;
          }

          if (column.indexOf('D\'s') > -1) {
            o.Defenses += cellNum;
          }

          o[column] = cell;
        }

      });

      o.Overall = o.Assists + o.Scores + o.Defenses

      return o;
    });

// maleAssist Leader:  Tommy Rush
// Scoring Leader:  Aikeem Grant
// Defensive Leader:  Brandon Morrison
// MVP:  Frank Grande

    rows = _.sortBy(rows, function (d) {return d.Overall;}).reverse();

    var awards = {
      Male: {},
      Female: {}
    };

    var keys = ['Assists', 'Scores', 'Defenses', 'Overall'];

    keys.forEach(function (key) {
      awards.Female[key] = 0;
      awards.Male[key]   = 0;
    });

    for (var i = 0; i < rows.length; i++) {

      var p = rows[i];

      if (p.Gender === 'Female') {
        for (var j = 0; j < keys.length; j++) {
          var key = keys[j];
          if (p[key] > awards.Female[key]) {
            awards.Female[key] = p[key];
          }
        } 
      }

      if (p.Gender === 'Male') {
        for (var j = 0; j < keys.length; j++) {
          var key = keys[j];
          if (p[key] > awards.Male[key]) {
            awards.Male[key] = p[key];
          }
        }
      }
    }

    $scope.leaderboard = rows.splice(0,10);
    $scope.contenders  = rows;
    $scope.awards      = awards;

    console.log(awards);

  });

  query.error(function (e) {
    alert('Error connecting to database.');
  })
});

})();