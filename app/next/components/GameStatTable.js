import { PlayerLink } from './PlayerLink'

export default function GameStatTable (props) {
  const { team, isGamePreview } = props
  return (
    <table className="table table-striped">
      <thead>
        <tr>
          <th>Name</th>
          <th>Assists</th>
          <th>Scores</th>
          <th>Defenses</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        {team.stats.length > 0 && team.stats.filter(s => isGamePreview ? true : s.attended || s.total > 0).map((stat, index) => (
          <tr key={index}>
            <td><PlayerLink player={stat.player} /></td>
            <td>{stat.assists}</td>
            <td>{stat.scores}</td>
            <td>{stat.defenses}</td>
            <td>{stat.total}</td>
          </tr>
        ))}
        {team.stats.length === 0 && team.players.map((player, index) => (
          <tr key={index}>
            <td><PlayerLink player={player} /></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr>
          <th>Total</th>
          <th>{team.stats.reduce((a, s) => a + s.assists, 0)}</th>
          <th>{team.stats.reduce((a, s) => a + s.scores, 0)}</th>
          <th>{team.stats.reduce((a, s) => a + s.defenses, 0)}</th>
          <th>{team.stats.reduce((a, s) => a + s.total, 0)}</th>
        </tr>
      </tfoot>
    </table>
  )
}
