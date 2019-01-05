(function () {

    var app = angular.module("draftboardApp",[]);

    app.controller("PlayerTableController", function ($http, $scope) {
        
        var query = $http.get('/players?registered=true');
        
        query.success(function (hatterPlayers) {
            
            $scope.players = hatterPlayers.sort(function (a,b) {
                
                var aGender = a.gender === "Female" ? 1: 0;
                var bGender = b.gender === "Female" ? 1: 0;
                
                var genderDiff = bGender - aGender;

                if (genderDiff === 0) {
                    return b.skillLevel - a.skillLevel;
                }
                
                return bGender - aGender;
            });
        });

        query.error(function (err) {
            alert("There was an issue connecting to database.");
            console.log(err);
        });
    });
})();
