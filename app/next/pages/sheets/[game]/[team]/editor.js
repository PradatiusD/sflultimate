import SeoHead from '../../../../components/SeoHead'
import StatEditor from '../../../../components/StatEditor'
import { getStatEditorPageProps } from '../../../../lib/stat-editor-data'

export const getServerSideProps = getStatEditorPageProps

export default function GameStatEditorPage (props) {
  const { game, team, opponent } = props
  const gameDate = new Date(game.scheduledTime).toLocaleString('en-US', {
    timeZone: 'America/New_York',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })

  return (
    <>
      <SeoHead
        title={`${team.name} Game Stats`}
        description={`Enter ${team.name} stats for the game against ${opponent.name}.`}
        path={`/sheets/${game.id}/${team.id}/editor`}
        noindex
        image={false}
      >
        <link rel="stylesheet" href="/styles/site.css" media="all" />
      </SeoHead>
      <main className="container stat-editor-page">
        <header>
          <p className="text-uppercase text-muted mb-1">{game.league.title}</p>
          <h1>{team.name} Stats</h1>
          <p className="lead mb-1">vs. {opponent.name}</p>
          <p className="text-muted">{gameDate}</p>
        </header>
        <p className="alert alert-info">
          Enter the final score, then use the + buttons to record each player&apos;s stats.
        </p>
        <StatEditor {...props} mobile />
      </main>
      <style jsx>{`
        .stat-editor-page {
          max-width: 760px;
          padding-top: 1rem;
          padding-bottom: 2rem;
        }
        header { margin-bottom: 1rem; }
        h1 { margin-bottom: .25rem; }
      `}</style>
    </>
  )
}
