import { HeaderNavigation } from '../components/Navigation'
import SeoHead from '../components/SeoHead'
import DonationForm from '../components/DonationForm'
import { updateWithGlobalServerSideProps } from '../lib/global-server-side-props'

export async function getServerSideProps () {
  const props = {}
  await updateWithGlobalServerSideProps(props)
  return { props }
}

export default function DonatePage ({ leagues }) {
  return <>
    <SeoHead title="Donate" description="Help more people find their place on the field. Support South Florida Ultimate programs and community." path="/donate" />
    <HeaderNavigation section="donate" leagues={leagues} />
    <main className="container py-5" id="main-content">
      <div className="row justify-content-center"><div className="col-lg-8">
        <h1>Help more people find their place on the field.</h1>
        <p className="lead">Remember your first pickup game? Someone explained the rules, threw you the disc, and invited you back. Your donation helps South Florida Ultimate welcome more people into the game. Support local programs that give players a chance to learn, play, and find a community.</p>
        <DonationForm />
      </div></div>
    </main>
  </>
}
