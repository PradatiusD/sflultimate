const mapping = {
  1: '57f2ab1604c19e0300d5525a', // green
  2: '57f2aa5c04c19e0300d55257', // blue
  3: '57f2aabb04c19e0300d55258', // black
  4: '57f2aae104c19e0300d55259' // pink
}

const index = {
  // Players                Team
  '56b02d4b70b93aac39b41172': '1',
  '56b02d4870b93aac39b41168': '1',
  '56b02d2970b93aac39b410f7': '1',
  '56b02d3770b93aac39b41127': '1',
  '56b02d9070b93aac39b41258': '1',
  '56b02d3370b93aac39b4111b': '1',
  '56b02d3170b93aac39b41113': '1',
  '56b02d3f70b93aac39b41146': '1',
  '57ee6fd94203210300813093': '1',
  '56ca068be3d0b00300c61fc8': '1',
  '56b02d7470b93aac39b4120a': '1',
  '57efe2621467a7030028e537': '1',
  '56b02d3470b93aac39b4111c': '1',
  '56b02d2670b93aac39b410ec': '1',
  '56bca4689ae1ec030069439f': '2',
  '56b02d7970b93aac39b4121a': '2',
  '57ec39eecb0c560300f450b3': '2',
  '56bf7ee2e3d2a90300c7707d': '2',
  '56b3ff19c7810e030065dc36': '2',
  '56bf6495d203eb0300ed51dd': '2',
  '56bf7756e9d64b0300267652': '2',
  '56b02d3270b93aac39b41115': '2',
  '57f181cdea07fc03008b611d': '2',
  '56b02d8270b93aac39b41235': '2',
  '57ee8fdc4203210300813094': '2',
  '56b02d3670b93aac39b41124': '2',
  '57f02fe956ec8b03007cf566': '2',
  '56b02d2570b93aac39b410eb': '2',
  '56b02d2b70b93aac39b410ff': '2',
  '56b02d2570b93aac39b410e9': '3',
  '56b02d2070b93aac39b410dc': '3',
  '56b02d1f70b93aac39b410da': '3',
  '56b02d7d70b93aac39b41226': '3',
  '56b02d6870b93aac39b411dd': '3',
  '56b02d7370b93aac39b41205': '3',
  '57f0210956ec8b03007cf565': '3',
  '57f1429c56ec8b03007cf567': '3',
  '57f17d3dea07fc03008b611c': '3',
  '56b02d1f70b93aac39b410d9': '3',
  '56b02d2370b93aac39b410e4': '3',
  '56b02d3b70b93aac39b41138': '3',
  '56b02d3170b93aac39b41112': '3',
  '56b02d6770b93aac39b411d7': '3',
  '56b02d2170b93aac39b410de': '4',
  '56b02d2e70b93aac39b41109': '4',
  '57ec04b09316730300e40891': '4',
  '56b40b2ac7810e030065dc37': '4',
  '56b02d2170b93aac39b410dd': '4',
  '57efea3756ec8b03007cf564': '4',
  '56b02d2770b93aac39b410f1': '4',
  '57efd3b61467a7030028e535': '4',
  '56b02d9a70b93aac39b41274': '4',
  '57eced08cb0c560300f450b4': '4',
  '56b02d3170b93aac39b41111': '4',
  '56b02d3e70b93aac39b41144': '4',
  '56b431d5c7810e030065dc38': '4',
  '57ebe3319316730300e40890': '4'
}

for (const playerId in index) {
  const teamId = mapping[index[playerId]]
  const params = {
    $push: {
      players: ObjectId(playerId)
    }
  }
  db.teams.update({ _id: ObjectId(teamId) }, params)
}
