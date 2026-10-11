const categories = [
  ['athleticismLevel', 'Athleticism'],
  ['experienceLevel', 'Experience'],
  ['throwsLevel', 'Throws']
]

function ratingStyle (rating) {
  if (rating === null) return undefined
  const hue = (Math.min(5, Math.max(1, rating)) - 1) * 30
  return { backgroundColor: `hsl(${hue}, 75%, 85%)`, color: '#212529' }
}

export default function TeamRatingSummary ({ players = [] }) {
  const groups = [
    ['Overall', players],
    ['MMP', players.filter(player => player.gender === 'Male')],
    ['FMP', players.filter(player => player.gender === 'Female')]
  ]
  const otherPlayers = players.filter(player => !['Male', 'Female'].includes(player.gender))
  if (otherPlayers.length) groups.push(['Other / unspecified', otherPlayers])
  const hasRatings = players.some(player => categories.some(([field]) => Number.isFinite(player[field])))

  return (
    <section className="mb-4" aria-labelledby="team-summary-heading">
      <h2 id="team-summary-heading" className="h3 text-center">Team Summary</h2>
      <p className="text-center">
        {players.length} players · {groups[1][1].length} MMP · {groups[2][1].length} FMP
        {otherPlayers.length > 0 && ` · ${otherPlayers.length} other / unspecified`}
      </p>
      {hasRatings && (
        <>
          <div className="row">
            {[false, true].map(weighted => (
              <div className="col-lg-6" key={String(weighted)}>
                <div className="table-responsive">
                  <table className="table">
                    <caption className="caption-top">{weighted ? 'Attendance-weighted averages' : 'Unweighted averages'}</caption>
                    <thead>
                      <tr>
                        <th scope="col">Group</th>
                        {categories.map(([field, label]) => <th scope="col" key={field}>{label}</th>)}
                        <th scope="col">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groups.map(([label, members]) => {
                        const ratings = categories.map(([field]) => {
                          const available = members.filter(player => Number.isFinite(player[field]) && (!weighted || Number.isFinite(player.participation)))
                          const sum = available.reduce((sum, player) => sum + player[field] * (weighted ? player.participation / 100 : 1), 0)
                          const weight = available.reduce((sum, player) => sum + (weighted ? player.participation / 100 : 1), 0)
                          return {
                            field,
                            average: weight > 0 ? sum / weight : null,
                            partial: available.length < members.length
                          }
                        })
                        const total = ratings.every(rating => rating.average !== null)
                          ? ratings.reduce((sum, rating) => sum + rating.average, 0) / ratings.length
                          : null
                        ratings.push({ field: 'total', average: total, partial: ratings.some(rating => rating.partial) })
                        return (
                          <tr key={label}>
                            <th scope="row">{label}</th>
                            {ratings.map(({ field, average, partial }) => (
                              <td key={field} style={ratingStyle(average)}>
                                {average === null ? '—' : Number(average.toFixed(2))}
                                {average !== null && partial && <span title="Some players are missing data">*</span>}
                              </td>
                            ))}
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
          <div className="d-flex align-items-center flex-wrap gap-2 small mb-3" aria-label="Rating color scale from 1, lowest, to 5, highest">
            <span>Rating scale:</span>
            {[1, 2, 3, 4, 5].map(rating => (
              <span key={rating} className="px-3 py-1 rounded" style={ratingStyle(rating)}>{rating}</span>
            ))}
            <span className="text-muted">1 = lowest · 5 = highest</span>
          </div>
          <p className="small text-muted mb-0">
            Total is the average of the three skill averages, shown only when all three are available.
            {' '}Attendance-weighted averages divide the sum of ratings × expected attendance by the sum of expected attendance percentages from registration, not recorded game attendance.
            {' '}— means no data or no attendance weight available. * indicates incomplete data; players missing a rating or expected attendance are excluded from that average.
          </p>
        </>
      )}
    </section>
  )
}
