import Head from 'next/head'
import { HeaderNavigation } from '../components/Navigation'
import {updateWithGlobalServerSideProps} from "../lib/global-server-side-props";

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

export async function getServerSideProps () {
  const props = {}
  await updateWithGlobalServerSideProps(props)
  return {
    props
  }
}

export default function YouthPage (props) {
  const { leagues } = props
  return (
    <div>
      <Head>
        <title>SFLUltimate: Youth Programs</title>
        <meta property="og:title" content="SFLUltimate: Youth Programs" />
        <meta property="og:url" content="https://www.sflultimate.com/youth" />
        <meta property="og:image" content="https://d137pw2ndt5u9c.cloudfront.net/keystone/690fca0052551268b0637ba1-images-data%20(1).jpg" />
        <meta property="og:description" content="Learn more about our youth ultimate programs, including summer camps, clinics, and other programming." />
      </Head>
      <HeaderNavigation leagues={leagues} />

      <VideoBackground
        src={'https://d137pw2ndt5u9c.cloudfront.net/youth-video.mp4'}
        text={'About Youth Ultimate'}
      />

      <div className="container">
        <div className="row">
          <div className="col-md-8 offset-md-2">
            <h1>Youth Ultimate Clinics</h1>
            <p><strong>South Florida Ultimate, Inc., a 501c(3) non-profit dedicated to growing the sport of ultimate frisbee</strong> hosts ultimate clinics that are open to all youth who are interested in learning how to play this exciting sport.</p>
            <p>These clinics are designed to help participants to <strong>develop their skills in Ultimate while also providing a fun and engaging environment</strong>.</p>
            <p>Whether you are new to Ultimate or looking to improve your abilities, these clinics offer a great opportunity to learn, grow, and enjoy the game with others who share your enthusiasm.</p>

            <p>A typical clinic is the following format:</p>
            <ul>
              <li>2 hours or more on how to play ultimate frisbee with walkthroughs, drills, and scrimmages that help develop athletes over the long-term</li>
              <li>Group max: 40 kids</li>
              <li>Group minimum: 14 kids</li>
              <li>We also strive to ensure that each kid is given their own disc as a gift from South Florida Ultimate</li>
            </ul>

            <h2>Snapshot: Our 2025 Clinic</h2>
            <p>On July 15, 2025, we hosted our first Ultimate Frisbee clinic at the Sports Camp Director Christian Academy in Cooper City, Florida.</p>
            <p>Our event welcomed 31 children, ranging in age from 7 to 14 years old, with the support of their Physical Education teacher, Gina F.</p>
            <p><strong>Clinic Activities</strong></p>
            <ul>
              <li>The clinic began with an introduction to the sport of Ultimate Frisbee.</li>
              <li>Students participated in age-appropriate drills, practice sessions, and games tailored to their individual skill levels.</li>
              <li>Each student received a disc upon completing the clinic as a token of their participation and achievement.</li>
            </ul>
          </div>
        </div>
      </div>
      <VideoBackground
        src={'https://d137pw2ndt5u9c.cloudfront.net/youth-sizzle.mp4'}
        text={'Meet Our Coaches & Philosophy'}
      />
      <div className="container">
        <div className="row">
          <div className="col-md-8 offset-md-2">
            <img
              className="img-fluid rounded-circle"
              style={{ maxWidth: '200px', margin: '0 auto' }}
              src="https://d137pw2ndt5u9c.cloudfront.net/keystone/68d4a37d2747d60029c57b07-lina-fonseca.jpg"
              alt="Lina Fonseca headshot" />
            <h2>Our Youth Director: Lina Fonseca</h2>
            <p>
              <strong>Lina Fonseca</strong> started playing ultimate with the local women's team Soul Lions at the age of 13, the city team from Ibagué, Colombia.
            </p>
            <p>From that experience and her talent, she received a full scholarship at the University of Tolima - Ibagué.</p>
            <p>In 2019 she moved to South Florida, playing with Fire Ultimate, Rocket, Fiasco Women's Ultimate team, reaching to the heights of USAU Nationals with Spanglish in Colorado.   She serves as the Youth Director, and is certified by USAU for Safe Sport Training, CDC Heads Up, and Youth Coach.</p>
            <p>
              She deeply appreciated the community, the structure, the discipline, and the values that Ultimate shared to her, and that is why she wishes to share that same passion and joy with kids
            </p>
            <h4>Coaching Experience</h4>
            <p>
              With years of coaching experience, we brings a wide variety of strategies and tactics from all around the world. As club players, we understand the technical aspects of the sport and is skilled at breaking down complex concepts into simple terms for the athletes.
            </p>
            <h4>Philosophy</h4>
            <p>
              Our coaching philosophy centers around creating a positive and inclusive environment where players feel comfortable to take risks, make mistakes, and learn from each experience. He emphasizes skill development, strategy, and teamwork while explaining how important values such as sportsmanship, respect, and perseverance are in ultimate.
            </p>
            <p>
              Through engaging and dynamic training sessions, Coach Aguiar focuses on teaching fundamental skills such as throwing, catching, cutting, and defensive positioning, while also introducing more advanced tactics and game scenarios. He believes in adapting his coaching approach to meet the individual needs and abilities of each player, ensuring that everyone has the opportunity to succeed and thrive.
            </p>
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
      <img className="img-fluid" style={{margin: '0 auto'}} src="https://d137pw2ndt5u9c.cloudfront.net/keystone/690fc69647c54d00296d1dad-youth-clinic.webp" alt=""/>
    </div>
  )
}
