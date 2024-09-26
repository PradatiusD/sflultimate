(function () {
  function isObject (o) {
    return o && typeof o === 'object' && o.constructor.name === 'Object' && !Array.isArray(o) && !o.mimetype
  }
  
  const keysEdited = []

  function traverse (o, prefix, collectionStr, b) {
    for (const k in o) {
      const v = o[k]
      const suffix = prefix + k.charAt(0).toUpperCase() + k.slice(1, k.length)
      if (isObject(v)) {
        traverse(v, suffix, collectionStr, b)
      } else {
        const newKey = prefix + suffix
        b[newKey] = v
        print(collectionStr + '-> migrated ' + newKey)
        const logKey = collectionStr + '->' + newKey
        if (keysEdited.indexOf(logKey) === -1) {
          keysEdited.push(logKey)
        }
      }
    }
  }

  const collections = [
    'pickups',
    'players',
    'boardmembers',
    'leagues'
  ]
  collections.forEach(function (collectionStr) {
    const collection = db[collectionStr]
    print(collectionStr)
    collection.find({}).toArray().forEach(function (b) {
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
          traverse(val, key, collectionStr, b)
          delete b[key]
        }
      })
      collection.save(b)
    })
  })
  printjson(keysEdited)
})()
