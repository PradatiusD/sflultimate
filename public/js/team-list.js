(function () {

var app = angular.module("TeamApp",[]);


function createShirtList (teams) {

  var headers = ['Team Color','First Name','Last Name','Shirt Size'];
  var csv     = headers.join("\t")+"\n";

  teams.forEach(function (team){
    team.players.forEach(function (player) {
      csv += [team.color,player.name.first, player.name.last, player.shirtSize].join("\t")+"\n";
    });
  });
  return csv;
}


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


    $scope.teams = teams;
  });


  query.error(function (err) {
    alert("There was an issue connecting to database.");
    console.log(err);
  });

});
})();