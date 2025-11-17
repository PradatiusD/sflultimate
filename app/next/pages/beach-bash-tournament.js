import Head from 'next/head'
import { gql } from '@apollo/client'
import GraphqlClient from '../lib/graphql-client'
import Countdown from 'react-countdown'

function Spanify (props) {
  const words = props.text.split(' ')
  return (
    <span>
        {
          words.map((w, i) => {
            return (
              <><span key={i}>{w}</span>{" "}</>
            )
          })
        }
      </span>
  )
}

export const getServerSideProps = async () => {
  const results = await GraphqlClient.query({
    query: gql`
      query {
        allTournamentTeams(sortBy: [name_ASC]) {
          id
          name
          image {
            publicUrl
          }
          captainNames
          competitionName
          locationName
        }
      }`
  })
  return {
    props: {
      teams: results.data.allTournamentTeams
    }
  }
}
export default function BeachBashTournament (props) {
  const { teams } = props

  const content = {
    seoTitle: 'South Florida Ultimate • Beach Bash 2026',
    registrationLink: 'https://docs.google.com/forms/d/e/1FAIpQLSeu6GPwqcvLgxDn7vq-cOfApIEeIaiUI3Z1lLj6ppcti2upFQ/viewform?usp=publish-editor',
    freeAgentLink: 'https://docs.google.com/forms/d/1mU4130RrsMuAooBZDhUW6hyZQIH619XJHy3vcvbU5_c'
  }

  return (
    <>
      <Head>
        <title>{content.seoTitle}</title>
        <meta property="og:title" content={content.seoTitle}/>
        <meta property="og:url" content="https://www.sflultimate.com/beach-bash-tournament"/>
        <meta property="og:image"
              content="https://www.sflultimate.com/images/open-graph/2023-beach-bash-tournament.jpg"/>
        <meta property="og:description"
              content="Beach Bash is Back! A 4 on 4 Beach Ultimate tournament February 21-22 2026 in Fort Lauderdale!"/>
        <link rel="stylesheet" href="/styles/beach-bash-tournament.css"/>
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin/>
        <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@200..700&display=swap" rel="stylesheet"/>
      </Head>
      <section className="bash-video-background">
        <video autoPlay muted loop>
          <source src="https://d137pw2ndt5u9c.cloudfront.net/sfl-beach-bash-tournament-with-play-v1.mp4"
                  type="video/mp4"/>
        </video>
        <div className="container-fluid beach-bash-hero-container">
          <br/>
          <div className="jumbotron text-center">
            <img src="/images/beach-bash-2025-logo.svg" alt="Beach Bash Logo"/>
            <div>
              <Countdown
                date={new Date('2026-02-22T14:00:00.000Z').getTime()}
                intervalDelay={1000}
                precision={0}
                renderer={(props) => {
                  return (
                    <div className="beach-countdown">
                      <span><strong>{props.days}</strong> days</span>
                      <span><strong>{props.hours}</strong> hours</span>
                      <span><strong>{props.minutes}</strong> minutes</span>
                      <span><strong>{props.seconds}</strong> seconds</span>
                    </div>
                  )
                }}
              />
            </div>
          </div>
        </div>
      </section>
      <div className="photo-bg-container">
        <div className="photo-bg">
        </div>
        <div className="photo-copy">
          <h2><Spanify text="Beach Bash is Back!" /></h2>
          <p>Florida’s <strong>highest-level</strong> Beach Ultimate
            Championship.</p>
          <h3>February 21-22, 2026<br/>@ <strong>Ft. Lauderdale Beach</strong></h3>
          <div className="cta-container">
            <a className="btn btn-primary btn-lg" target="_blank" href={content.registrationLink}> Submit a Bid</a>
            <a className="btn btn-primary btn-lg free-agent-btn" target="_blank" href={content.freeAgentLink}> Free Agent Sign Up</a>
          </div>
        </div>
      </div>

      <div className="beach-bash-content-container container-fluid">
        <div className="row bird-wing-background">
          <div className="col-lg-2 col-md-12 col-lg-offset-1">
          </div>
          <div className="col-lg-8 col-md-12">
            <p>We are playing in the <strong>heart of the pristine Ft Lauderdale Beach the weekend of February 21-22 2026</strong>.</p>
              <p>The format is <strong>4v4 USA Ultimate rules with a 2:2 gender ratio</strong>. We will have <strong>lined fields</strong> for a guaranteed
                4 games of Saturday pool play and at least 3 games of Sunday bracket play.</p>
            <p>Cost: <strong>$500 gets you a 10-person team</strong>. Up to 4 additional people can be added for $50 per player. 14 players maximum per roster.</p>
            <p>Showers, restrooms, bars, restaurants, and convenient stores <strong>all within walking distance of the beach!</strong></p>
            <p>We will be having a Saturday night tournament party with location TBD.</p>
            <p>Come join the hottest beach ultimate community in Florida! See you in December!</p>
            <div className="alert alert-info">
              <p><strong>Free Agents:</strong> don’t have a team, but want to play? You can register as a free agent. While it’s not a guarantee we will find you a team, we will do our best to get you on a squad. If you do land on a team, or we have enough free agents to make a full team, you’ll be required to pay a $50 entry fee and will get full participation in the tournament festivities.</p>
            </div>
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1690.3133871864395!2d-80.10470750573026!3d26.110114190972915!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x88d90184490da219%3A0x1a08e5d36463b739!2sOcean%20Rescue%20Tower%20%231!5e1!3m2!1sen!2sus!4v1696989472039!5m2!1sen!2sus"
              width="100%" height="450" style={{ border: 0 }} allowFullScreen={true} loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"></iframe>
          </div>
        </div>
      </div>

      <hr/>
      <h2 className="text-center">Last Year's Teams</h2>
      <p className="text-center lead">Use the below to get a sense of the competition that came to join us in Fort.
        Lauderdale!</p>
      <section className="team-list-tournament">
        {
          teams.map((team) => {
            const imgStyle = {}
            if (team.image) {
              imgStyle.backgroundImage = 'url(' + team.image.publicUrl + ')'
            }
            return (
              <article key={team.name} style={imgStyle}>
                <div className="team-copy-container">
                  <h3>{team.name}</h3>
                  <small>{team.locationName} • {team.competitionName} • {team.captainNames}</small>
                </div>
              </article>
            )
          })
        }
      </section>

      <hr/>

      <div className="container">
        <div className="row bird-wing-background">
          <div className="col-md-2 col-md-offset-1">
            <h2>Frequently Asked Questions</h2>
            <p>Find here all your tourney information.</p>
          </div>
          <div className="col-md-8">
            <div className="panel panel-default">
              <div className="panel-heading">
                <div className="panel-title">How many teams will this be?</div>
              </div>
              <div className="panel-body">
                We're set on inviting <strong>12 teams</strong> from Florida as well as from around the USA (and
                hopefully the world).
              </div>
            </div>
            <div className="panel panel-default">
              <div className="panel-heading">
                <div className="panel-title">How much is the bid fee?</div>
              </div>
              <div className="panel-body">It's <strong>$500</strong>, we use this for field permits and tournament drinks/snacks.</div>
            </div>
            <div className="panel panel-default">
              <div className="panel-heading">
                <div className="panel-title">What's the gender ratio? How many players?</div>
              </div>
              <div className="panel-body">This will be a 2:2 mixed beach tournament, with a minimum of 4 players and a
                maximum of 14 players per team.
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
