'use server'
export default function StatTable (props) {
  const { players, awards, startRowNumber, statKeysToCompare } = props
  return (
    <table className="table table-striped">
      <thead>
        <tr>
          <th>Rank</th>
          <th>Team Color</th>
          <th>First Name</th>
          <th>Last Name</th>
          <th>Assists</th>
          <th>Scores</th>
          <th>Defenses</th>
          <th>Overall</th>
        </tr>
      </thead>
      <tbody>
        {
          players.map((player, index) => {
            return (
              <tr key={player.id}>
                <td>{startRowNumber + index}</td>
                <td>
                  <span className="team-color" style={{ backgroundColor: player.teamColor }}></span>
                </td>
                <td>
                  <a href={player.url}>{player.firstName}</a>
                </td>
                <td>
                  <a href={player.url}>{player.lastName}</a>
                </td>
                {
                  statKeysToCompare.map((key) => {
                    return (
                      <td key={key}>
                        <span
                          className={awards[player.gender][key] === player[key] ? 'badge ' + player.gender : ''}>{player[key]}</span>
                      </td>
                    )
                  })
                }
              </tr>
            )
          })
        }
      </tbody>
    </table>
  )
}
