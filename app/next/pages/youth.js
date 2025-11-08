import Head from 'next/head'
import { HeaderNavigation } from '../components/Navigation'

function VideoBackground (props) {
  return (
    <div className="video-background-youth">
      <video autoPlay muted loop>
        <source src={props.src} type="video/mp4" />
      </video>
      <h2>
        {props.text}
      </h2>
    </div>
  )
}

export default function YouthPage () {
  return (
    <div>
      <Head>
        <title>SFLUltimate: Youth Programs</title>
        <meta property="og:title" content="SFLUltimate: Youth Programs" />
        <meta property="og:url" content="https://www.sflultimate.com/youth" />
        <meta property="og:image" content="https://www.sflultimate.com/images/open-graph/homepage.jpg" />
        <meta property="og:description" content="Learn more about our youth ultimate programs, including summer camps, clinics, and other programming." />
      </Head>
      <HeaderNavigation />

      <VideoBackground
        src={'https://d137pw2ndt5u9c.cloudfront.net/youth-video.mp4'}
        text={'About Youth Ultimate'}
      />

      <div className="container-fluid">
        <div className="row">
          <br/>
          <div className="col-sm-8 col-sm-offset-2">
            <div className="row">
              <div className="col-md-4">
                <br/>
                <br/>
                <img
                  className="img-responsive img-circle"
                  style={{ maxWidth: '200px' }}
                  src="https://d137pw2ndt5u9c.cloudfront.net/keystone/68d4a37d2747d60029c57b07-lina-fonseca.jpg"
                  alt="Lina Fonseca headshot" />
              </div>
              <div className="col-md-8">
                <h2>Our Youth Director: Lina Fonseca</h2>
                <p>
                  Lina Fonseca, started playing ultimate with the local women's team Soul Lions at the age of 13, the city team from Ibagué, Colombia.  From that experience and her talent, she received a full scholarship at the University of Tolima - Ibagué.  In 2019 she moved to South Florida, playing with Fire Ultimate, Rocket, Fiasco Women's Ultimate team, reaching to the heights of USAU Nationals with Spanglish in Colorado.   She serves as the Youth Director, and is certified by USAU for Safe Sport Training, CDC Heads Up, and Youth Coach.
                  She deeply appreciated the community, the structure, the discipline, and the values that Ultimate shared to her, and that is why she wishes to share that same passion and joy with kids
                </p>
              </div>
            </div>
            <h4>Coaching Experience</h4>
            <p>
              With years of coaching experience, we brings a wide variety of strategies and tactics from all around the world. As club players, we understand the technical aspects of the sport and is skilled at breaking down complex concepts into simple terms for the athletes.
            </p>
            <div className="row">
              <div className="col-md-6">
                <img src="https://d137pw2ndt5u9c.cloudfront.net/keystone/68d4a04b2747d60029c5791f-youth-demo.jpg" alt="Youth Demo" className="img-responsive"/>
              </div>
              <div className="col-md-6">
                <h4>Philosophy</h4>
                <p>
                  Our coaching philosophy centers around creating a positive and inclusive environment where players feel comfortable to take risks, make mistakes, and learn from each experience. He emphasizes skill development, strategy, and teamwork while explaining how important values such as sportsmanship, respect, and perseverance are in ultimate.
                </p>
              </div>
              <p>
                Through engaging and dynamic training sessions, Coach Aguiar focuses on teaching fundamental skills such as throwing, catching, cutting, and defensive positioning, while also introducing more advanced tactics and game scenarios. He believes in adapting his coaching approach to meet the individual needs and abilities of each player, ensuring that everyone has the opportunity to succeed and thrive.
              </p>
            </div>
          </div>
          <VideoBackground
            src={'https://d137pw2ndt5u9c.cloudfront.net/youth-sizzle.mp4'}
            text={'Sports & Wellness'}
          />
          <div className="container">
            <h4>Development</h4>
            <p>
              Beyond the Xs and Os of the game, we prioritizes the development of our players, helping their confidence, leadership skills, and sense of belonging within the ultimate frisbee community. Our goal is to serve as a mentor and role model, inspiring young athletes to reach their full potential both on and off the field.
            </p>
            <h4>Let&#39;s Play</h4>
            <p>
              Players not only improve their athletic abilities but also cultivate lifelong friendships, memories, and a deep appreciation for the sport of ultimate frisbee. His passion, dedication, and commitment to excellence make him a valued leader and mentor for youth ultimate frisbee players everywhere.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
