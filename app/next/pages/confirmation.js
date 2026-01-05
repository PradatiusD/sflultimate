import GraphqlClient from '../lib/graphql-client'
import { gql } from '@apollo/client'
import { HeaderNavigation } from '../components/Navigation'
import LeagueUtils from '../lib/league-utils'
import { addLeagueToVariables } from '../lib/utils'
import Head from 'next/head'

export const getServerSideProps = async (context) => {
  const variables = addLeagueToVariables(context)
  const results = await GraphqlClient.query({
    query: gql`
      query($leagueCriteria: LeagueWhereInput) {
        allLeagues(where:$leagueCriteria) {
          id
          title
          slug
          earlyRegistrationStart
          earlyRegistrationEnd
          registrationStart
          registrationEnd
          lateRegistrationStart
          lateRegistrationEnd
        }
        Player(where: {id: "${context.query.id}"}) {
          id
          firstName
          lastName
          email
        }
      }`,
    variables
  })

  const league = JSON.parse(JSON.stringify(results.data.allLeagues[0]))
  LeagueUtils.addLeagueStatus(league)

  const referer = context.req.headers.referer || null
  return {
    props: {
      league,
      referer,
      player: results.data.Player
    }
  }
}

export default function ConfirmationPage (props) {
  const { league, referer, player } = props
  const parsedURL = new URL(referer)
  const validPathNames = ['/register-team', '/leagues/' + league.slug + '/register']

  function ErrorState () {
    return (
      <>
        <HeaderNavigation league={league} />
        <div className="container">
          <h1>Error</h1>
          <p>The referrer for this request was not valid.</p>
        </div>
      </>
    )
  }

  if (!referer) {
    return <ErrorState />
  }
  if (validPathNames.indexOf(parsedURL.pathname) === -1) {
    return <ErrorState />
  }

  return <>
    <Head>
      <title>Your Order for {league.title} is Confirmed!</title>
    </Head>
    <HeaderNavigation league={league} />
    <img src="https://d137pw2ndt5u9c.cloudfront.net/keystone/67bbc3865bfcdf00289f58a1-IMG_9589-optimized.jpg" className="img-fluid" alt="" style={{
      maxHeight: '480px',
      margin: '1rem auto',
      borderRadius: '1rem'
    }}/>
    <div className="container">
      <div className="row">
        <div className="col-md-12">
          <div className="text-center">
            <h1>Thank you {player.firstName}!</h1>
            <p className="lead">We&apos;ve successfully received your payment!</p>
          </div>
          <p>Please check your email at <strong>{player.email}</strong> for a confirmation email.</p>
          <p>Feel free to <strong>share the joy</strong> of having signed up to play! Also don't forget to follow us on social media!</p>
          <ul>
            <li><a target="_blank" href="https://instagram.com/sflultimate">Instagram</a></li>
            <li><a target="_blank" href="https://chat.whatsapp.com/FZC77g5Tzsw8xwxMXG997V">WhatsApp</a></li>
            <li><a target="_blank" href="https://www.facebook.com/sflultimate">Facebook</a></li>
            <li><a target="_blank" href="https://www.tiktok.com/@sflultimate">TikTok</a></li>
          </ul>

        </div>
      </div>
      <h2>Frequently Asked Questions</h2>
      <p><strong>How will teams be picked and will we have time to practice/get to know each other before the first
        game?</strong></p>
      <p>Teams are picked via a draft. Captains meet right after registration closes and pick teams, trying to balance
        each team with new and experienced players as well as to make sure teams have an even gender balance.</p>

      <p><strong>Do people typically wear cleats? If so, what type? If you have recommendations for specific pairs, that
        would be great since my old ones are toast.</strong></p>
      <p>Yes, people wear cleats. Some like soccer cleats, others like lacrosse, and a few wear football cleats, it
        really just depends on what feels right for your feet.</p>

      <p><strong>Will there be a schedule released?</strong></p>
      <p>Schedules are released after the draft, because at that point we define how many teams will be playing. Right
        now we will be close to the boundary between 4 and 6 teams.</p>

      <p><strong>Regarding COVID, do people typically wear masks when not playing (on the sideline). Just wondering if
        there are any policies or recommendations to wear masks. Good either way, just want to know what’s
        expected.</strong></p>
      <p>People generally do not wear masks. We do ask however that if you are sick or not feeling well to let your
        captains know and not attend for risk of impacting others.</p>

      <p><strong>Is there anything else I should know as a new person starting in this league?</strong></p>
      <p>If possible try to play some pick up before attending league so that you can get a feel for how people play.
        That will give you a feel of how people play in the area. If you are not sure on where to find pick up, then
        visit <a href="https://www.sflultimate.com/pickups" target="_blank">https://www.sflultimate.com/pickups</a>.</p>
      <p>I also recommend that you skim through the rules as they sometimes change <a
        href="https://usaultimate.org/rules/" target="_blank">https://usaultimate.org/rules/</a>.</p>
      <p>Note that even experienced players forget to check these rules, but knowledge of them helps clear up awkward
        confusions, and allows you to make confident assessments of what happens during a foul.</p>
    </div>
  </>
}
