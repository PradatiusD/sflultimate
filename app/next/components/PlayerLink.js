export function buildPlayerUrl (player) {
  return ('/players/' + player.firstName + ' ' + player.lastName).trim().replace(/\s/g, '-').toLowerCase()
}

export function PlayerLink (options) {
  const { player } = options
  const nameString = player.firstName + ' ' + player.lastName
  const formattedName = nameString.split(' ').map(function (namePart) {
    const name = namePart.charAt(0).toUpperCase() + namePart.slice(1).toLowerCase()
    if (name.includes('-')) {
      return name.split('-').map(function (subName) {
        return subName.charAt(0).toUpperCase() + subName.slice(1).toLowerCase()
      }).join('-')
    }
    return name
  }).join(' ')
  return (
    <a href={buildPlayerUrl(player)} target="_blank">
      {formattedName}
    </a>
  )
}
