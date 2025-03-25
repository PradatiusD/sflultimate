
export default function Standings (props) {
  const { games, teamsFilter } = props
  const teamMap = {}
  games.forEach(game => {
    ['homeTeam', 'awayTeam'].forEach((type) => {
      const id = game[type].id
      const name = game[type].name
      if (!teamMap[id]) {
        teamMap[id] = {
          name: name,
          games: []
        }
      }
      teamMap[id].games.push(game)
    })
  })

  const standingsMap = {}
  for (const game of games) {
    const homeTeam = {
      id: game.homeTeam.id,
      score: game.homeTeamScore,
      forfeit: game.homeTeamForfeit
    }

    const awayTeam = {
      id: game.awayTeam.id,
      score: game.awayTeamScore,
      forfeit: game.awayTeamForfeit
    }

    const createEntryIfMissing = function (teamId) {
      if (!standingsMap[teamId]) {
        standingsMap[teamId] = {
          name: teamMap[teamId].name,
          wins: 0,
          losses: 0,
          pointDiff: 0,
          pointsScored: 0,
          pointsAllowed: 0,
          forfeits: 0
        }
      }
    }

    createEntryIfMissing(awayTeam.id)
    createEntryIfMissing(homeTeam.id)
    if (homeTeam.forfeit || awayTeam.forfeit) {
      if (homeTeam.forfeit) {
        standingsMap[homeTeam.id].forfeits++
      }
      if (awayTeam.forfeit) {
        standingsMap[awayTeam.id].forfeits++
      }

      if (homeTeam.forfeit && awayTeam.forfeit) {
        // both teams take 13 point loss
        standingsMap[homeTeam.id].pointDiff -= 13
        standingsMap[homeTeam.id].losses++

        standingsMap[awayTeam.id].pointDiff -= 13
        standingsMap[awayTeam.id].losses++
      } else {
        if (homeTeam.forfeit) {
          standingsMap[homeTeam.id].losses++
          standingsMap[homeTeam.id].pointDiff -= 13
          standingsMap[homeTeam.id].pointsAllowed += 13
          standingsMap[homeTeam.id].pointsScored += 0
          standingsMap[awayTeam.id].wins++
        } else if (awayTeam.forfeit) {
          standingsMap[awayTeam.id].losses++
          standingsMap[awayTeam.id].pointDiff -= 13
          standingsMap[awayTeam.id].pointsAllowed += 13
          standingsMap[awayTeam.id].pointsScored += 0
          standingsMap[homeTeam.id].wins++
        }
      }
    } else if (homeTeam.score !== 0 && awayTeam.score !== 0) {
      const pointDiff = Math.abs(homeTeam.score - awayTeam.score)
      let winner
      let loser
      if (homeTeam.score > awayTeam.score) {
        winner = homeTeam
        loser = awayTeam
      } else {
        winner = awayTeam
        loser = homeTeam
      }

      standingsMap[winner.id].wins++
      standingsMap[winner.id].pointDiff += pointDiff
      standingsMap[winner.id].pointsAllowed += loser.score
      standingsMap[winner.id].pointsScored += winner.score

      standingsMap[loser.id].losses++
      standingsMap[loser.id].pointDiff -= pointDiff
      standingsMap[loser.id].pointsAllowed += winner.score
      standingsMap[loser.id].pointsScored += loser.score
    }
  }

  let standings = []
  for (const id in standingsMap) {
    const teamEntry = standingsMap[id]
    const totalGames = teamEntry.wins + teamEntry.losses
    teamEntry.avgPointsScoredPerGame = totalGames !== 0 ? (teamEntry.pointsScored / totalGames).toFixed(2) : ''
    teamEntry.avgPointsAllowedPerGame = totalGames !== 0 ? (teamEntry.pointsAllowed / totalGames).toFixed(2) : ''
    teamEntry.id = id
    standings.push(teamEntry)
  }
  standings.sort(function (a, b) {
    const winDiff = b.wins - a.wins
    if (winDiff !== 0) {
      return winDiff
    }
    return b.pointDiff - a.pointDiff
  })

  if (teamsFilter) {
    standings = standings.filter(teamsFilter)
  }

  return (
    <>
      <table className="table table-striped table-bordered text-center">
        <thead>
          <tr>
            <th className="text-center">Name</th>
            <th className="text-center">Wins</th>
            <th className="text-center">Losses</th>
            <th className="text-center">Forfeits</th>
            <th className="text-center">Points Scored</th>
            <th className="text-center">Points Allowed</th>
            <th className="text-center">Avg. Points Scored</th>
            <th className="text-center">Avg. Points Allowed</th>
            <th className="text-center">Point Differential</th>
          </tr>
        </thead>
        <tbody>
          {
            standings.map((team, index) => {
              return (
                <tr key={team.id}>
                  <td className="text-left">{team.name}</td>
                  <td>{team.wins}</td>
                  <td>{team.losses}</td>
                  <td>{team.forfeits}</td>
                  <td>{team.pointsScored}</td>
                  <td>{team.pointsAllowed}</td>
                  <td>{team.avgPointsScoredPerGame}</td>
                  <td>{team.avgPointsAllowedPerGame}</td>
                  <td>{team.pointDiff}</td>
                </tr>
              )
            })
          }
        </tbody>
      </table>
      <p>
        <em>Note: If one team forfeits, the opponent gets the equivalent of 13-0 game. If two teams playing
          each other forfeit, each takes a loss and a -13 hit to point differential.</em>
      </p>
    </>
  )
}
