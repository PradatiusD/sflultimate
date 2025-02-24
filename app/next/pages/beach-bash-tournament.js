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
      'Team Hometown': 'Jacksonville',
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
        <title>South Florida Ultimate Beach Bash 2024</title>
        <meta property="og:title" content="South Florida Ultimate Beach Bash 2024"/>
        <meta property="og:url" content="https://www.sflultimate.com/beach-bash-tournament"/>
        <meta property="og:image"
              content="https://www.sflultimate.com/images/open-graph/2023-beach-bash-tournament.jpg"/>
        <meta property="og:description"
              content="Come down to sunny Ft. Lauderdale for our inaugural ultimate frisbee beach championship December 16-17th!"/>
        <link rel="stylesheet" href="/styles/beach-bash-tournament.css"/>
      </Head>
      <div className="bash-video-background">
        <video autoplay="true" muted="true" loop="true">
          <source src="https://d137pw2ndt5u9c.cloudfront.net/sfl-beach-bash-tournament.mp4" type="video/mp4"/>
        </video>
      </div>
      <div className="container-fluid beach-bash-hero-container">
        <br/>
        <div className="jumbotron text-center">
          <img src="/images/beach-bash-logo.png" alt=""/>
          <p className="tagline">Come down to sunny Ft. Lauderdale for our beach ultimate championship on <strong>December
            16 & 17th</strong>!</p>
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

        <div className="beach-bash-content-container container-fluid">
          <div className="row">
            <div className="col-md-2 col-md-offset-1">
              <h2>Tournament Overview</h2>
            </div>
            <div className="col-md-8">
              <h3>Time to soak some sun in Florida</h3>
              <p>Welcome to the Beach Bash Ultimate Tournament. Florida’s newest and highest level beach ultimate frisbee tournament.</p> 
              <p>We are playing in the heart of the pristine Ft Lauderdale Beach the weekend of December 16-17, 2023. The format is 4v4 USA Ultimate rules with a 2:2 gender ratio. We will have lined fields for a guaranteed 4 games of Saturday pool play and at least 3 games of Sunday bracket play.</p> 
              <p>Cost is $400 per 10 person team (~$40 per player). Up to 4 additional players can be added for $40 per player with a maximum 14 players.</p> 
              <p>Showers, restrooms, bars, restaurants, and convenient stores all within walking distance of the beach!</p> 
              <p>We will be having a Friday night registration party in Ft Lauderdale and a Saturday night tournament party location tbd.</p> 
              <p>Come join the hottest beach ultimate community in Florida! See you in December!</p> 
              <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1690.3133871864395!2d-80.10470750573026!3d26.110114190972915!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x88d90184490da219%3A0x1a08e5d36463b739!2sOcean%20Rescue%20Tower%20%231!5e1!3m2!1sen!2sus!4v1696989472039!5m2!1sen!2sus" width="100%" height="450" style={{border: 0}} allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>  
            </div>
          </div>
        </div>
        
      <hr/>
        <h2 className="text-center">Signed Up Teams</h2>
        <p className="text-center lead">Use the below to get a sense of the competition coming to join us in Fort. Lauderdale!</p> 
        <div className="row">
          {
            teams.map((team) => {
              return (
                <div className="col-md-3 col-sm-4 col-xs-6">
                  <div className="panel panel-default text-center">
                    <div className="panel-heading">
                      <h3 className="panel-title">{team["Team Name"]}</h3>
                      {
                        !team.in_state &&
                        <span className="badge" style={{background: "#217f92", fontWeight: 400, padding: "5px 10px"}}>Out of State</span>
                      }
                    </div>
                    <div className="panel-body">
                      Level: {team["Competitive Level"]}<br/>
                      From: {team["Team Hometown"]}<br/>
                      Captain: {team["Captain Name"]}
                    </div>
                  </div>
                </div>
              )
            })
          }
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
                We're set on inviting <strong>12 teams</strong> from Florida as well as from around the USA (and hopefully the world).
                    </div>
                </div>
                <div className="panel panel-default">
                    <div className="panel-heading">
                        <div className="panel-title">How much is the bid fee?</div>
                    </div>
                    <div className="panel-body">It's <strong>$400</strong>, we use this for field permits and tournament drinks/snacks.  Plus if your team captain has played South Florida league, you'll get a $50 discount. 🎉</div>
                </div>
                <div className="panel panel-default">
                    <div className="panel-heading">
                        <div className="panel-title">What's the gender ratio?  How many players?</div>
                    </div>
                    <div className="panel-body">This will be a 2:2 mixed beach tournament, with a minimum of 4 players and a maximum of 14 players per team.</div>
                </div>
          </div>
        </div>
      </div>
    </>
  )
}
