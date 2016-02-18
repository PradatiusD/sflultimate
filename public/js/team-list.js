(function () {

var app = angular.module("TeamApp",[]);

app.controller("TeamListController",function ($http, $scope) {

  var query = $http.get('/teams?f=json');

  query.success(function (data) {

    var teams   = data.teams;
    var players = data.players;

    function matchToPlayerById (playerId) {
  		for (var i = 0; i < players.length; i++) {
  			if (players[i]._id === playerId) {
  				return players[i];
  			}
  		}    	
    }

    teams = teams.map(function (team) {

    	team.captains = team.captains.map(matchToPlayerById);
    	team.players  = team.players.map(matchToPlayerById);

    	return team;
    });

    console.log(teams);

    $scope.teams = teams;

  });

  query.error(function (err) {
    alert("There was an issue connecting to database.");
    console.log(err);
  });

});
})();