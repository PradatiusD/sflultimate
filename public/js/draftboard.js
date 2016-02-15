(function (){

  $.get('/players?registered=true', function (playerData) {

  	var players  = playerData.sort(function (a, b) {
  		return parseInt(a.skill) > parseInt(b.skill) ? -1: 1;
  	});

  	var $table = $('#draftboard').find('table');
  	var $tbody = $table.find('tbody');

  	$("#draftboard").prepend('<p class="lead">There are '+players.length+' players registered<span id="matchCount"></span>.</p>');

    var matchCountVal = 0;
    var $matchCount   = $("#matchCount");

  	players.forEach(function (d) {
  		var name = d.full_name.first+' '+d.full_name.last;
  		var partnerName = false;
  		var match = false;

  		for (var i = 0; i < playerData.length; i++) {
  			if (d.partner === playerData[i].id) {
  				partnerName = playerData[i].full_name.first + " " + playerData[i].full_name.last;


  				if (d.id === playerData[i].partner) {

  					match = true;
            matchCountVal++;
  				}
  				break;
  			}
  		};

  		partnerName    = partnerName || "";

  		var matchHTML;
  		if (match) {
  			matchHTML = '<span class="label label-info">Full Match</span>';
  		} else if (partnerName) {
  			matchHTML = '<span class="label label-default" style="opacity: 0.4;">Half Match</span>';
  		} else {
  			matchHTML = '';
  		}

	  	$tbody.append('<tr><td>'+name+'</td><td>'+d.skill+'</td><td>'+partnerName+'</td><td>'+matchHTML+'</td></tr>');
  	});

    $matchCount.text(" and "+ (matchCountVal/2) +" couples");
  });
})();