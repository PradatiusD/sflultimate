(function (){

  var app = angular.module("draftboardApp",[]);

  app.controller("PlayerTableController",function ($http, $scope, $window) {

    var isLoggedIn = document.getElementById("loggedin");

    $scope.viewProfile = function (id) {
      if (isLoggedIn) {
        $window.open("/keystone/players/"+id, "_blank");      
      }
    };

    $scope.matches = 0;

    var query = $http.get('/players?registered=true');

    var partners = {};

    query.success(function (data) {

      var players = [];

      data.forEach(function (player) {
        partners[player.id] = player.full_name.first + " " + player.full_name.last;
      });

      data.forEach(function (player, i, playerArr) {
        
        if (player.partner) {
          player.partnerName = partners[player.partner];
        }

        for (var i = 0; i < playerArr.length; i++) {
          if (player.partner === playerArr[i].id && playerArr[i].partner === player.id) {
            player.partnerMatch = true;
            $scope.matches++;
            break;
          }
        }

        players.push(player);

      });

      $scope.players = players;
    });

    query.error(function (err) {
      alert("There was an issue connecting to database.");
      console.log(err);
    });

  });


})();