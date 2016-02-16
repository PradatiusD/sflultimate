(function (){

  var app = angular.module("draftboardApp",[]);

  app.controller("PlayerTableController",function ($http, $scope) {

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


//   	$("#draftboard").prepend('<p class="lead">There are '+players.length+' players registered<span id="matchCount"></span>.</p>');


//   	players.forEach(function (d) {
//   		var name        = d.full_name.first+' '+d.full_name.last;
//   		var partnerName = false;
//   		var match       = false;

//   		for (var i = 0; i < playerData.length; i++) {
//   			if (d.partner === playerData[i].id) {
//   				partnerName = playerData[i].full_name.first + " " + playerData[i].full_name.last;


//   				if (d.id === playerData[i].partner) {

//   					match = true;
//             matchCountVal++;
//   				}
//   				break;
//   			}
//   		};

//   		partnerName    = partnerName || "";

//   		var matchHTML;
//   		if (match) {
//   		} else {
//   			matchHTML = '';
//   		}

//       var gender = d.gender ? d.gender: '';

// 	  	$tbody.append('<tr><td>'+name+'</td><td>'+gender+'</td><td>'+d.skill+'</td><td>'+partnerName+'</td><td>'+matchHTML+'</td></tr>');
//   	});

//     $matchCount.text(" and "+ (matchCountVal/2) +" couples");
//   });
})();