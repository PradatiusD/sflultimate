db.boardmembers.find().forEach(function (b){
  b.firstName = b.name.first
  b.lastName = b.name.last
  delete b.name
  printjson(b)
  db.boardmembers.save(b)
})
