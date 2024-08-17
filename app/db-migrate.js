(function () {
  function isObject (o) {
    return o && typeof o === 'object' && !Array.isArray(o) && !o.mimetype
  }
  const keysEdited = []
  const collections = [
    'pickups',
    'players',
    'boardmembers',
    'leagues'
  ]
  collections.forEach(function (collectionStr) {
    const collection = db[collectionStr]
    print(collectionStr)
    collection.find().forEach(function (b) {
      Object.keys(b).forEach(function (key) {
        if (key === '_id') {
          return
        }

        if (key === 'name') {
          b.firstName = b.name.first
          b.lastName = b.name.last
          delete b.name
        }
        const val = b[key]
        if (isObject(val)) {
          Object.keys(val).forEach(function (subKey) {
            const newKey = key + subKey.charAt(0).toUpperCase() + subKey.slice(1, subKey.length)
            if (isObject(val[subKey])) {
              Object.keys(val[subKey]).forEach(function (subSubKey) {
                const newSubKey = subKey + subSubKey.charAt(0).toUpperCase() + subSubKey.slice(1, subSubKey.length)
                const logStatement = collectionStr + ': fixed ' + key + '.' + subKey + '.' + subSubKey + ' into -> ' + collectionStr + '.' + newSubKey
                if (keysEdited.indexOf(logStatement) === -1) {
                  keysEdited.push(logStatement)
                }
              })
            } else {
              b[newKey] = val[subKey]
              const logStatement = collectionStr + ': fixed ' + key + '.' + subKey + ' into -> ' + collectionStr + '.' + newKey
              if (keysEdited.indexOf(logStatement) === -1) {
                keysEdited.push(logStatement)
              }
            }
          })
          delete b[key]
        }
        // printjson(b)
      })
      collection.save(b)
    })
  })
  printjson(keysEdited)
})()
