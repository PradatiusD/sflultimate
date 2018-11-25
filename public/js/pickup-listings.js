(function () {
    
    var map = new google.maps.Map(document.getElementById('pickup-listing-map'), {
        zoom: 9,
        center: {
            lat: 26.076477,
            lng: -80.252113
        }
    });
    
    angular.module('CommunityApp', []).controller("PickupsController",function ($http, $scope) {
        
        var query = $http.get('/pickups');        
        query.then(function (res) {
            
            $scope.games = res.data; 
            var infoWindows = [];
            
            res.data.forEach(function (game) {

                var contentString = ''+
                '<div id="content">'+
                    '<div id="siteNotice">'+
                    '</div>'+
                    '<h4 id="firstHeading" class="firstHeading">'+game.title+'</h4>'+
                    '<p class="text-muted"><b>'+game.day+' at '+ game.time +'</b></p>'+
                    '<p><b>'+game.location.type.toUpperCase()+': </b>'+ game.description +'</p>'+
                    '<div id="bodyContent">'+
                    ''+game.location.address.street+'<br>'+game.location.address.city+', '+game.location.address.state+', '+game.location.address.zipCode+'<br>'+
                '</div>';
                
                var infoWindow = new google.maps.InfoWindow({
                    content: contentString
                });

                infoWindows.push(infoWindow);

                var markerOptions = {
                    map: map,
                    position: {
                        lat: game.location.latitude,
                        lng: game.location.longitude,
                    },
                    title: game.title
                };

                console.log(markerOptions, game);
                
                var marker = new google.maps.Marker(markerOptions);

                marker.addListener('click', function() {

                    infoWindows.forEach(function (infoWindowItem) {
                        infoWindowItem.close();
                    });
                    infoWindow.open(map, marker);

                });
            });
        });
    });
    
})();

