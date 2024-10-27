export default function PlayerLink (options) {
  const { player } = options
  return (
    <a href={('/players/' + player.firstName + ' ' + player.lastName).trim().replace(/\s/g, '-').toLowerCase()} target="_blank">
      {player.firstName} {player.lastName}
    </a>
  )
}
