import { getGamePageProps } from '../../lib/game-utils'
import GamePage from '../../components/GamePage'

export const getServerSideProps = async (context) => {
  return getGamePageProps(context, { redirectToLeagueRoute: true })
}

export default GamePage

//
//   // If no stats, show preview state of all stats
//   if (stats.length === 0) {
//     locals.preview = true
//     const currentSeasonGames = await Game.model.find({
//       league: locals.game.league._id
//     }, { _id: 1 }).lean()
//
//     const playerFind = {
//       game: {
//         $in: currentSeasonGames.map(game => game._id)
//       },
//       player: {
//         $in: locals.game.homeTeam.players.concat(locals.game.awayTeam.players)
//       }
//     }
//     // Now I need to reduce to season records
//     const statMap = {}
//     for (const stat of stats) {
//       const id = stat.player._id.toString()
//       stat.throwaways = stat.throwaways || 0
//       stat.drops = stat.drops || 0
//       if (!statMap[id]) {
//         statMap[id] = stat
//       } else {
//         statMap[id].assists += stat.assists || 0
//         statMap[id].scores += stat.scores || 0
//         statMap[id].defenses += stat.defenses || 0
//         statMap[id].throwaways += stat.throwaways || 0
//         statMap[id].drops += stat.drops || 0
//       }
//     }
//     stats = Object.values(statMap)
//   }
//
//   const awayTeamStats = stats.filter(function (stat) {
//     return playerMap[stat.player._id.toString()] === 'awayTeam'
//   })
//
//
//   locals.teams = [
//     {
//       score: locals.game.awayTeamScore,
//       name: locals.game.awayTeam.name,
//       standing: locals.game.awayTeam.standing,
//       stats: awayTeamStats
//     },
//     {
//       score: locals.game.homeTeamScore,
//       name: locals.game.homeTeam.name,
//       standing: locals.game.homeTeam.standing,
//       stats: homeTeamStats
//     }
//   ]
