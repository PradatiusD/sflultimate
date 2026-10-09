export function buildGameUrl (league, game) {
  const gameId = typeof game === 'string' ? game : (game?.id || game?._id)
  return `/leagues/${league.slug}/games/${gameId}`
}
