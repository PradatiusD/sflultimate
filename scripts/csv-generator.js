// mongo --quiet sflultimate scripts/csv-generator.js > scripts/players.csv

db.players.find({registered: true}).forEach(function (p) {

  var row = [
    p._id.valueOf(),
    p.name.first,
    p.name.last,
    p.skillLevel,
    p.participation,
    p.gender,
    p.partner ? p.partner.valueOf(): "",
  ];

  try {
    row.push(p.partner ? db.players.find({_id: ObjectId( p.partner.valueOf()), partner: ObjectId(p._id.valueOf())}).next().name.first : "")
    row.push(p.partner ? db.players.find({_id: ObjectId( p.partner.valueOf()), partner: ObjectId(p._id.valueOf())}).next().name.last  : "")
  }
  catch (e) {
    row.push("")
    row.push("")
  }

  print(row.join(","));
});

// {
//   "_id" : ObjectId("57f181cdea07fc03008b611d"),
//   "partner" : ObjectId("56b02d2570b93aac39b410eb"),
//   "email" : "ehj723@gmail.com",
//   "password" : "$2a$10$mzqxM2vEswSeunJo9CjdeOJoFyFbn6DqLsSkNpfvpws1e7VXHe9lm",
//   "shirtSize" : "S",
//   "skillLevel" : "1",
//   "participation" : "80",
//   "ageGroup" : "Adult",
//   "registered" : true,
//   "name" : {
//     "first" : "Elyse",
//     "last" : "Jones"
//   },
//   "__v" : 0,
//   "gender" : "Female",
//   "isAdmin" : false
// }