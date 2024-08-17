[
  'players',
  'boardmembers'
].forEach(function (collectionStr) {
  const collection = db[collectionStr]
  collection.find().forEach(function (b){
    if (b.name) {
      b.firstName = b.name.first
      b.lastName = b.name.last
      delete b.name
      printjson(b)
      collection.save(b)
    }
  })
})
