(function () {

var app = angular.module("TeamApp",[]);

function createShirtList (teams) {

  var headers = ["Player ID","Team Color","First Name","Last Name","Shirt Size", "Gender"];
  var csv     = headers.join("\t")+"\n";

  teams.forEach(function (team){
    team.players.forEach(function (player) {
      csv += [player._id, team.color, player.name.first, player.name.last, player.gender].join("\t")+"\n";
    });
  });

  return csv;
}


function createEmailList (teams) {

  var messages = [];

  teams.forEach(function (team) {

    var msg = "To: ";

    var captainIds = [];

    team.captains.forEach(function (captain) {
      msg += captain.email + ", ";
      captainIds.push(captain._id);   
    });

    msg += "\n\n";

    team.players.forEach(function (player) {
      if (captainIds.indexOf(player._id) === -1) {
        msg += player.name.first + " " + player.name.last + " (" + player.email + ")\n";
      }
    });

    messages.push(msg);
  });

  return messages.join("\n");
}

app.controller("TeamListController",function ($http, $scope) {

  $scope.getTeamsAndPlayers = function () {

    var url   = "/teams?f=json";
    var query = $http.get(url);

    query.then(function (response) {

      var data    = response.data;
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

        team.menTotal   = 0;
        team.womenTotal = 0;

        team.players.forEach(function (player) {
          if (player.gender === "Male")   { team.menTotal++;  }
          if (player.gender === "Female") { team.womenTotal++;}
        });

        return team;
      });


      $scope.teams = teams;

      // console.log(createShirtList(teams));
      // console.log(createEmailList(teams));
    }, function (err) {
      alert("There was an issue connecting to database.");
      console.log(err);
    });
  }

});
})();