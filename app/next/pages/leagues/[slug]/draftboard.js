import { HeaderNavigation } from '../../../components/Navigation'
import DraftRoom from '../../../components/draftboard/DraftRoom'
import SeoHead from '../../../components/SeoHead'
import { updateWithGlobalServerSideProps } from '../../../lib/global-server-side-props'

export async function getServerSideProps (context) {
  if (!context.req.user) {
    return {
      redirect: {
        destination: `/admin/signin?from=${encodeURIComponent(context.resolvedUrl)}`,
        permanent: false
      }
    }
  }

  const leagueSlug = context.params.slug
  const props = {
    leagueSlug,
    initialState: null,
    setupError: null
  }
  try {
    const { getDraftState } = require('../../../lib/draft-store')
    props.initialState = await getDraftState(leagueSlug, { role: 'admin' }, { createIfMissing: true })
  } catch (error) {
    if (error.code === 'DRAFT_SETUP_INVALID') props.setupError = error.message
    else throw error
  }
  await updateWithGlobalServerSideProps(props)
  return { props: JSON.parse(JSON.stringify(props)) }
}

export default function Draftboard ({ leagueSlug, initialState, setupError, leagues }) {
  const leagueTitle = initialState?.league.title || leagueSlug
  return (
    <>
      <SeoHead
        title={`${leagueTitle} Draftboard`}
        description={`${leagueTitle} commissioner draft room.`}
        path={`/leagues/${leagueSlug}/draftboard`}
        noindex
        image={false}
      />
      <HeaderNavigation leagues={leagues} />
      <main className="container-fluid draft-room-page">
        <DraftRoom leagueSlug={leagueSlug} initialState={initialState} setupError={setupError} />
      </main>
    </>
  )
}
