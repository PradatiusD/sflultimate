import { useState } from 'react'
import { HeaderNavigation } from '../../../../../components/Navigation'
import CaptainLogin from '../../../../../components/draftboard/CaptainLogin'
import DraftRoom from '../../../../../components/draftboard/DraftRoom'
import SeoHead from '../../../../../components/SeoHead'
import { updateWithGlobalServerSideProps } from '../../../../../lib/global-server-side-props'

export async function getServerSideProps (context) {
  const leagueSlug = context.params.slug
  const teamSlug = context.params.teamSlug
  const { getCaptainPageInfo, getDraftState } = require('../../../../../lib/draft-store')
  let pageInfo
  try {
    pageInfo = await getCaptainPageInfo(leagueSlug, teamSlug)
  } catch (error) {
    if (error.statusCode === 404) return { notFound: true }
    throw error
  }

  let initialState = null
  try {
    const { getViewerFromRequest } = require('../../../../../lib/draft-api')
    const viewer = getViewerFromRequest(context.req, { captainOnly: true })
    if (viewer.role === 'captain' && viewer.teamId === pageInfo.team.id) {
      initialState = await getDraftState(leagueSlug, viewer)
    }
  } catch (error) {
    if (error.statusCode !== 401) throw error
  }

  const props = { leagueSlug, teamSlug, pageInfo, initialState }
  await updateWithGlobalServerSideProps(props)
  return { props: JSON.parse(JSON.stringify(props)) }
}

export default function CaptainDraftboard ({ leagueSlug, teamSlug, pageInfo, initialState, leagues }) {
  const [state, setState] = useState(initialState)

  const logout = async () => {
    await fetch('/api/draft/logout', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ league: leagueSlug })
    })
    setState(null)
  }

  return (
    <>
      <SeoHead
        title={`${pageInfo.team.name} Draft Room`}
        description={`${pageInfo.league.title} captain draft room.`}
        path={`/leagues/${leagueSlug}/draftboard/captain/${teamSlug}`}
        noindex
        image={false}
      />
      <HeaderNavigation leagues={leagues} />
      <main className="container-fluid draft-room-page">
        {state
          ? (
            <>
              <div className="draft-room__captain-toolbar">
                <span>Signed in for <strong>{pageInfo.team.name}</strong></span>
                <button className="btn btn-outline-secondary btn-sm" onClick={logout}>Sign out</button>
              </div>
              <DraftRoom leagueSlug={leagueSlug} initialState={state} />
            </>
            )
          : <CaptainLogin leagueSlug={leagueSlug} teamSlug={teamSlug} teamName={pageInfo.team.name} onLogin={setState} />}
      </main>
    </>
  )
}
