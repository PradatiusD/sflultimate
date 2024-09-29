(function () {
  function isObject (o) {
    return o && typeof o === 'object' && o.constructor.name === 'Object' && !Array.isArray(o) && !o.mimetype
  }

  function relationship (ref1, prop, ref2, record) {
    if (!record[prop]) {
      return
    }
    record[prop].forEach(function (p) {
      const o = {}
      o[ref1 + '_left_id'] = record._id
      o[ref2 + '_right_id'] = p

      // db.team_captains_manies.insert({
      //   Team_left_id: record._id,
      //   Player_right_id: p
      // })

      const key = [ref1.toLowerCase() + '_' + prop + '_manies']
      db[key].insert(o)
    })
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
    'leagues',
    'teams'
  ]
  collections.forEach(function (collectionStr) {
    const collection = db[collectionStr]
    print(collectionStr)
    collection.find({}).toArray().forEach(function (record) {
      Object.keys(record).forEach(function (key) {
        if (key === '_id') {
          return
        }

        const val = record[key]
        if (key === 'name' && isObject(val)) {
          record.firstName = record.name.first
          record.lastName = record.name.last
          delete record.name
        }

        if (isObject(val)) {
          traverse(val, key, collectionStr, record)
          delete record[key]
        }
      })

      if (collectionStr === 'teams') {
        relationship('Team', 'captains', 'Player', record)
        relationship('Team', 'players', 'Player', record)
      } else if (collectionStr === 'players') {
        relationship('Player', 'leagues', 'League', record)
        if (record.preferredPositions) {
          record.preferredPositions = record.preferredPositions.join(', ')
        }
      }

      collection.save(record)
    })
  })
  printjson(keysEdited)

  db.users.insert({
    // i5JI97£Klip]
    email: 'sflultimate@gmail.com',
    password: '$2a$10$zTMYxl/4pd7DCrC5WDy.PuXSW1Jwkhb9xXLvNwg46J6fn1JY1SyqS',
    firstName: 'Test',
    lastName: 'User'
  })
})()
