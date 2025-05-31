export function buildPlayerUrl (player) {
  return ('/players/' + player.firstName + ' ' + player.lastName).trim().replace(/\s/g, '-').toLowerCase()
}
export function PlayerLink (options) {
  const { player } = options
  return (
    <a href={buildPlayerUrl(player)} target="_blank">
      {player.firstName} {player.lastName}
    </a>
  )
}
