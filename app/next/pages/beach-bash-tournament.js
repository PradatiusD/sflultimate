import Head from 'next/head'
export default function BeachBashTournament (props) {
  const teams = [
    {
      'Team Name': 'Birthday Suit',
      'Captain Name': 'Mark S.',
      'Team Hometown': 'St. Petersburg, FL',
      'Competitive Level': 'Club',
      in_state: true
    },
    {
      'Team Name': 'Party Wave',
      'Captain Name': 'Andrea J.',
      'Team Hometown': 'Miami, FL',
      'Competitive Level': 'Pro',
      in_state: true
    },
    {
      'Team Name': 'Tbd',
      'Captain Name': 'Lucas A.',
      'Team Hometown': 'Weston, FL',
      'Competitive Level': 'Club',
      in_state: true
    },
    {
      'Team Name': 'Party B',
      'Captain Name': 'Megan B.',
      'Team Hometown': 'Fort Lauderdale, FL',
      'Competitive Level': 'Club',
      in_state: true
    },
    {
      'Team Name': 'Savage',
      'Captain Name': 'Lina F.',
      'Team Hometown': 'Miami, FL & West Palm Beach, FL',
      'Competitive Level': 'Club',
      in_state: true
    },
    {
      'Team Name': 'Dumb Beaches',
      'Captain Name': 'Bryan R.',
      'Team Hometown': 'Melbourne, FL',
      'Competitive Level': 'Club',
      in_state: true
    },
    {
      'Team Name': 'Latin Power',
      'Captain Name': 'Daniel Z.',
      'Team Hometown': 'Fort Myers, FL',
      'Competitive Level': 'Club',
      in_state: true
    },
    {
      'Team Name': 'SOUP Szn',
      'Captain Name': 'Xin Xin T.',
      'Team Hometown': 'Hershey, PA',
      'Competitive Level': 'Club',
      in_state: false
    },
    {
      'Team Name': 'Sky’s out Thighs out',
      'Captain Name': 'Chris S.',
      'Team Hometown': 'Jacksonville, FL',
      'Competitive Level': 'Club',
      in_state: true
    },
    {
      'Team Name': 'Unicorn Country',
      'Captain Name': 'Torre S.',
      'Team Hometown': 'Scranton, PA',
      'Competitive Level': 'College',
      in_state: false
    },
    {
      'Team Name': 'Latin Power',
      'Captain Name': 'Daren',
      'Team Hometown': 'Florida',
      'Competitive Level': 'Club',
      in_state: true
    }
  ].map(function (event) {
    return event
  }).sort(function (a, b) {
    return a['Team Name'].localeCompare(b['Team Name'])
  })

  return (
    <>
      <Head>
        <title>South Florida Ultimate • Beach Bash 2025</title>
        <meta property="og:title" content="South Florida Ultimate • Beach Bash 2025"/>
        <meta property="og:url" content="https://www.sflultimate.com/beach-bash-tournament"/>
        <meta property="og:image"
              content="https://www.sflultimate.com/images/open-graph/2023-beach-bash-tournament.jpg"/>
        <meta property="og:description"
              content="Beach Bash is Back! A 4 on 4 Beach Ultimate tournament February 21-22 2026 in Fort Lauderdale!"/>
        <link rel="stylesheet" href="/styles/beach-bash-tournament.css"/>
      </Head>
      <section className="bash-video-background">
        <video autoPlay="true" muted="true" loop="true">
          <source src="https://d137pw2ndt5u9c.cloudfront.net/sfl-beach-bash-tournament-with-play-v1.mp4" type="video/mp4"/>
        </video>
        <div className="container-fluid beach-bash-hero-container">
          <br/>
          <div className="jumbotron text-center">
            <img src="/images/beach-bash-logo.png" alt=""/>
            <p className="tagline">Come down to sunny Ft. Lauderdale for our beach ultimate championship on <strong>February 21-22 2026</strong>!</p>
            <p>
              <a className="btn btn-primary btn-lg" target="_blank"
                 href="https://docs.google.com/forms/d/e/1FAIpQLSffQliLEhIRV28WWFQM3A0HCaQ2XcWjPiJ5a98h5jlRdU8XFQ/viewform"> Submit
                a Bid
              </a>
              <a className="btn btn-primary btn-lg free-agent-btn" target="_blank"
                 href="https://docs.google.com/forms/d/e/1FAIpQLSdUOlXM7J7iG102OCFgXAyvz2MYW5qNgJt8r65nyUqgOu7fkg/viewform?usp=sf_link"> Free
                Agent Sign Up
              </a>
            </p>
          </div>
        </div>
      </section>
      <div className="beach-bash-content-container container-fluid">
        <div className="row">
          <div className="col-lg-2 col-md-12 col-lg-offset-1">
            <h2>Beach Bash is back!</h2>
          </div>
          <div className="col-lg-8 col-md-12">
            <h3>Time to soak some sun in Florida</h3>
            <p>Welcome to the Beach Bash Ultimate Tournament. Florida’s newest and highest level beach ultimate
              frisbee tournament.</p>
            <p>We are playing in the heart of the pristine Ft Lauderdale Beach the weekend of February 21-22 2026 in Fort Lauderdale.
              The format is 4v4 USA Ultimate rules with a 2:2 gender ratio. We will have lined fields for a guaranteed
              4 games of Saturday pool play and at least 3 games of Sunday bracket play.</p>
            <p>Cost: $500 gets you a 10 person team. Up to 4 additional people can be added for $50 per player. 14 players maximum per roster.</p>
            <p>Showers, restrooms, bars, restaurants, and convenient stores all within walking distance of the
              beach!</p>
            <p>We will be having a Friday night registration party in Ft Lauderdale and a Saturday night tournament
              party location tbd.</p>
            <p>Come join the hottest beach ultimate community in Florida! See you in December!</p>
            <div className="alert alert-info">
              <p><strong>Free Agents:</strong> don’t have a team, but want to play? You can register as a free agent. While it’s not a guarantee we will find you a team, we will do our best to get you on a squad. If you do land on a team, or we have enough free agents to make a full team, you’ll be required to pay a $50 entry fee and will get full participation in the tournament festivities.</p>
            </div>
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1690.3133871864395!2d-80.10470750573026!3d26.110114190972915!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x88d90184490da219%3A0x1a08e5d36463b739!2sOcean%20Rescue%20Tower%20%231!5e1!3m2!1sen!2sus!4v1696989472039!5m2!1sen!2sus"
              width="100%" height="450" style={{border: 0}} allowfullscreen="" loading="lazy"
              referrerpolicy="no-referrer-when-downgrade"></iframe>
          </div>
        </div>
      </div>

      <hr/>
      <h2 className="text-center">Last Year's Teams</h2>
      <p className="text-center lead">Use the below to get a sense of the competition thate came to join us in Fort.
        Lauderdale!</p>
      <div className="container-fluid">
        <section className="team-list-tournament">
          {
            teams.map((team) => {
              return (
                <div key={team['Team Name']}>
                  <div className="panel panel-default text-center">
                    <div className="panel-heading">
                      <h3 className="panel-title">{team['Team Name']}</h3>
                      <small className="text-muted">{team['Team Hometown']}</small><br/>
                      {
                        !team.in_state &&
                        <span className="badge" style={{background: '#217f92', fontWeight: 400, padding: '5px 10px'}}>Out of State</span>
                      }
                    </div>
                    <div className="panel-body">
                      Level: {team['Competitive Level']}<br/>
                      Captain: {team['Captain Name']}
                    </div>
                  </div>
                </div>
              )
            })
          }
        </section>
      </div>

      <hr/>

      <div className="row">
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
            <div className="panel-body">It's <strong>$400</strong>, we use this for field permits and tournament
              drinks/snacks. Plus if your team captain has played South Florida league, you'll get a $50 discount. 🎉
            </div>
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
    </>
  )
}
