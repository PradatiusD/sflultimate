var _     = require('underscore');

var teams = ["Pink","Green","Blue","Black"];
var dates = [
  "10/04/2016, 8:00PM",
  "10/11/2016, 8:00PM",
  "10/18/2016, 8:00PM",
  "10/25/2016, 8:00PM",
  "11/01/2016, 8:00PM",
  "11/08/2016, 8:00PM",
  "11/15/2016, 8:00PM",
  "11/22/2016, 8:00PM",
  "12/06/2016, 8:00PM",
];

// Each day has two games
var schedule = [];

function permutator (inputArr) {

  var results = [];

  function permute(arr, memo) {
    var cur, memo = memo || [];

    for (var i = 0; i < arr.length; i++) {
      cur = arr.splice(i, 1);
      if (arr.length === 0) {
        results.push(memo.concat(cur));
      }
      permute(arr.slice(), memo.concat(cur));
      arr.splice(i, 0, cur[0]);
    }

    return results;
  }

  return permute(inputArr);
}

var possibleGames = permutator(teams);

var uniqueGames = [];

possibleGames = possibleGames.forEach(function (game) {

  uniqueGames = uniqueGames.concat([
    [game[0], game[1]].sort().join(", "),
    [game[2], game[3]].sort().join(", ")
  ]);

});

uniqueGames = _.uniq(uniqueGames);

// possibleGames = _.uniq(possibleGames);


// console.log(possibleGames);

var i = 0;

// var scheduleGames = [];

// for (var i = 0; i < uniqueGames.length; i++) {

//   uniqueGames[i]
// }

// console.log(uniqueGames);

uniqueGames = [ 
  'Green, Pink | Black, Blue',
  'Pink, Blue | Black, Green',
  'Pink, Black | Blue, Green'
]

dates.forEach(function (date) {

  var games = uniqueGames[i % uniqueGames.length];
  if (games) {
    games = games.split(" | ");
    schedule.push(date + ", " + games[0])
    schedule.push(date + ", " + games[1])
  }

  i++;
})

console.log(JSON.stringify(schedule, null, 2))

// dates.forEach(function (date) {



//   var game1 = [getTeam(1), getTeam(0)];
//   var game2 = [getTeam(3), getTeam(4)];
//   i++;

//   schedule.push(date + ", "+ game1.join(", "));
//   schedule.push(date + ", "+ game2.join(", "));
// });
// 
// console.log(schedule);