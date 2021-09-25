var fs = require('fs')
var csv = fs.readFileSync('scripts/schedule.csv', 'utf8')
var moment = require('moment')

var csv = csv.split('\r\n')

var headers = csv[0].split(',')

for (var i = 1; i < csv.length; i++) {
  var row = csv[i].split(',')

  for (var j = 1; j < row.length; j++) {
    var cell = row[j]
    cell = cell.replace(/\s/g, '')
    cell = cell.split('vs')
    cell = cell.map(function (c) {
      return c.charAt(0) + c.substring(1).toLowerCase()
    })

    var teams = cell.join(', ')

    var date = row[0] + ' 2017'
    date = moment(new Date(date))
    date = date.format('MM/DD/YYYY')
    var time = headers[j].replace(' ', '')
    // '10/04/2016, 8:00PM, Green, Pink',
    var game = date + ', ' + time + ', ' + teams
    console.log(game)
  }
}
