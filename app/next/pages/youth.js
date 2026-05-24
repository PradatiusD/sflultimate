import Head from 'next/head'
import { HeaderNavigation } from '../components/Navigation'
import { updateWithGlobalServerSideProps } from '../lib/global-server-side-props'
import { Component } from 'react'

const coachFormUrl = 'https://docs.google.com/forms/d/1BPm-f2v4VwcRA6oDdE9rfNelEEbX5e7g1coJ7pGd9Uc/edit?pli=1'
const pageUrl = 'https://www.sflultimate.com/youth'
const seoTitle = 'Youth Ultimate Frisbee Programs in South Florida | SFL Ultimate'
const seoDescription = 'Find youth ultimate frisbee clinics, camps, and coaching opportunities in South Florida for kids and teens in Miami-Dade, Broward, and Palm Beach counties.'
const seoImage = 'https://d137pw2ndt5u9c.cloudfront.net/keystone/690fca0052551268b0637ba1-images-data%20(1).jpg'

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

function YouthInfoCard (props) {
  return (
    <div className="col-6 col-lg-4 d-flex mb-4">
      <div className="card h-100 text-center">
        <div className="card-body">
          <i className={`fa ${props.icon} fa-3x text-primary mb-3`} aria-hidden="true"></i>
          <h3 className="h4">{props.title}</h3>
          <p className="mb-0">{props.children}</p>
        </div>
      </div>
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

function BecomeYouthCoach () {
  return <>
    <hr />
    <p className="text-center">
      <a
        className="btn btn-primary btn-lg"
        href={coachFormUrl}
        target="_blank"
        rel="noopener noreferrer">
        Become a Youth Coach
      </a>
    </p>
    <hr/>
  </>
}

export default function YouthPage (props) {
  const { leagues } = props
  return (
    <div>
      <Head>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription}/>
        <meta name="keywords"
              content="youth ultimate frisbee South Florida, youth ultimate frisbee programs, kids ultimate frisbee, ultimate frisbee clinics, ultimate frisbee camps, Miami ultimate frisbee youth, Broward ultimate frisbee youth, Palm Beach ultimate frisbee youth, youth sports South Florida"/>
        <link rel="canonical" href={pageUrl}/>
        <meta property="og:title" content={seoTitle}/>
        <meta property="og:url" content={pageUrl}/>
        <meta property="og:image" content={seoImage}/>
        <meta property="og:image:width" content="1200"/>
        <meta property="og:image:height" content="630"/>
        <meta property="og:description" content={seoDescription}/>
        <meta name="twitter:card" content="summary_large_image"/>
        <meta name="twitter:title" content={seoTitle}/>
        <meta name="twitter:description" content={seoDescription}/>
        <meta name="twitter:image" content={seoImage}/>
      </Head>
      <HeaderNavigation leagues={leagues}/>

      <VideoBackground
        src={'https://d137pw2ndt5u9c.cloudfront.net/youth-video.mp4'}
        text={'About Youth Ultimate'}
      />

      <div className="container">
        <div className="row">
          <div className="col-md-8 offset-md-2">
            <h1>Youth Ultimate Clinics</h1>
            <p><strong>South Florida Ultimate, Inc., a 501c(3) non-profit dedicated to growing the sport of ultimate
              frisbee</strong> hosts ultimate clinics that are open to all youth who are interested in learning how to
              play this exciting sport.</p>
            <p>These clinics are designed to help participants to <strong>develop their skills in Ultimate while also
              providing a fun and engaging environment</strong>.</p>
            <p>Whether you are new to Ultimate or looking to improve your abilities, these clinics offer a great
              opportunity to learn, grow, and enjoy the game with others who share your enthusiasm.</p>
            <p>A typical clinic is the following format:</p>
            <ul>
              <li><strong>2 hours or more</strong> on how to play ultimate frisbee with walkthroughs, drills, and scrimmages that help
                develop athletes over the long-term
              </li>
              <li>Group max: 40 kids</li>
              <li>Group minimum: 14 kids</li>
              <li>We also strive to ensure that each kid is given their own disc as a gift from South Florida Ultimate
              </li>
            </ul>

            <BecomeYouthCoach/>

            <h2>Snapshot: Our 2025 Clinic</h2>
            <p>On July 15, 2025, we hosted our first Ultimate Frisbee clinic at the Sports Camp Director Christian
              Academy in Cooper City, Florida.</p>
            <p>Our event welcomed 31 children, ranging in age from 7 to 14 years old, with the support of their Physical
              Education teacher, Gina F.</p>
            <p><strong>Clinic Activities</strong></p>
            <ul>
              <li>The clinic began with an introduction to the sport of Ultimate Frisbee.</li>
              <li>Students participated in age-appropriate drills, practice sessions, and games tailored to their
                individual skill levels.
              </li>
              <li>Each student received a disc upon completing the clinic as a token of their participation and
                achievement.
              </li>
            </ul>
          </div>
        </div>
      </div>
      <img className="img-fluid" style={{ margin: '0 auto', width: '100%' }}
           src="https://d137pw2ndt5u9c.cloudfront.net/keystone/690fc69647c54d00296d1dad-youth-clinic.webp" alt=""/>

      <div className="container">
        <div className="row">
          <div className="col-md-8 offset-md-2">
            <div className="text-center">
              <img
                className="img-fluid rounded-circle"
                style={{ maxWidth: '200px', margin: '1rem auto' }}
                src="https://d137pw2ndt5u9c.cloudfront.net/keystone/68d4a37d2747d60029c57b07-lina-fonseca.jpg"
                alt="Lina Fonseca headshot"/>
              <h2>Our Youth Director: Lina Fonseca</h2>
              <p>
                <strong>Lina Fonseca</strong> started playing ultimate with the local women&#39;s team Soul Lions at the
                age of 13, the city team from Ibagué, Colombia.
              </p>
            </div>
            <p>From that experience and her talent, she received a full scholarship at the University of Tolima -
              Ibagué.</p>
            <p>In 2019 she moved to South Florida, playing with Fire Ultimate, Rocket, Fiasco Women&#39;s Ultimate team,
              reaching to the heights of USAU Nationals with Spanglish in Colorado. She serves as the Youth Director,
              and is certified by USAU for Safe Sport Training, CDC Heads Up, and Youth Coach.</p>
            <p>
              She deeply appreciated the community, the structure, the discipline, and the values that Ultimate shared
              to her, and that is why she wishes to share that same passion and joy with kids
            </p>
            <div className="row justify-content-center">
              <YouthInfoCard icon="fa-users" title="Coaching Experience">
                With years of coaching experience, we bring a wide variety of strategies and tactics from all around the
                world. As club players, we understand the technical aspects of the sport and are skilled at breaking
                down complex concepts into simple terms for the athletes.
              </YouthInfoCard>
              <YouthInfoCard icon="fa-heart" title="Philosophy">
                Our coaching philosophy centers around creating a positive and inclusive environment where players feel
                comfortable to take risks, make mistakes, and learn from each experience. We emphasize skill
                development, strategy, and teamwork while explaining how important values such as sportsmanship,
                respect, and perseverance are in ultimate.
              </YouthInfoCard>
              <YouthInfoCard icon="fa-bullseye" title="Fundamentals">
                Through engaging and dynamic training sessions, our coaches focus on teaching fundamental skills such as
                throwing, catching, cutting, and defensive positioning, while also introducing more advanced tactics and
                game scenarios.
              </YouthInfoCard>
              <YouthInfoCard icon="fa-smile-o" title="Adaptive">
                We believe in adapting our coaching approach to meet the individual needs and abilities of each player,
                ensuring that everyone has the opportunity to succeed and thrive.
              </YouthInfoCard>
              <YouthInfoCard icon="fa-line-chart" title="Development">
                Beyond the Xs and Os of the game, we prioritizes the development of our players, helping their
                confidence, leadership skills, and sense of belonging within the ultimate frisbee community. Our goal is
                to serve as a mentor and role model, inspiring young athletes to reach their full potential both on and
                off the field.
              </YouthInfoCard>
              <YouthInfoCard icon="fa-play-circle" title="Let&#39;s Play">
                Players not only improve their athletic abilities but also cultivate lifelong friendships, memories, and
                a deep appreciation for the sport of ultimate frisbee. Our passion, dedication, and commitment to
                excellence help us mentor youth ultimate frisbee players across South Florida.
              </YouthInfoCard>
            </div>
            <BecomeYouthCoach/>
          </div>
        </div>
      </div>
      <VideoBackground
        src={'https://d137pw2ndt5u9c.cloudfront.net/youth-sizzle.mp4'}
        text={'Let\' s Play!'}
      />
    </div>
  )
}
