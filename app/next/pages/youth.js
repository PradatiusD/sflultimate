import { HeaderNavigation } from '../components/Navigation'

export default function YouthPage () {
  return (
    <div>
      <HeaderNavigation />
      <div style={{ position: 'relative' }}>
        <video autoPlay muted loop style={{
          width: '100%',
          height: 'auto',
          objectFit: 'cover',
          minHeight: '400px',
          maxHeight: '50vh'
        }}>
          <source src="https://d137pw2ndt5u9c.cloudfront.net/youth-sizzle.mp4" type="video/mp4" />
        </video>
        <h2 style={{
          position: 'absolute',
          color: 'white',
          bottom: '10%',
          background: '#00000080',
          padding: '1rem 2rem',
          fontStyle: 'italic',
          fontSize: '6rem',
          letterSpacing: '3px'
        }}>
          Youth Ultimate
        </h2>
      </div>

      <div className="container-fluid">
        <div className="row">
          <div className="col-sm-8 col-sm-offset-2">
            <h2>Our Coach</h2>
            <p>
              Meet Coach Aguiar, a passionate and experienced youth ultimate frisbee coach dedicated to the love for the game while helping young athletes grow both on and off the field.
            </p>
            <img className="img-responsive" src="https://d137pw2ndt5u9c.cloudfront.net/youth-highlight.jpg" alt="Coach Aguiar coaching youth ultimate frisbee" />

            <h4>Coaching Experience</h4>
            <p>
              With years of coaching experience, Coach Aguiar brings a wide variety of strategies and tactics from all around the world. As a club player, he understands the technical aspects of the sport and is skilled at breaking down complex concepts into simple terms for the athletes.
            </p>

            <h4>Philosophy</h4>
            <p>
              Coach Aguiar’s coaching philosophy centers around creating a positive and inclusive environment where players feel comfortable to take risks, make mistakes, and learn from each experience. He emphasizes skill development, strategy, and teamwork while explaining how important values such as sportsmanship, respect, and perseverance are in ultimate.
            </p>
            <p>
              Through engaging and dynamic training sessions, Coach Aguiar focuses on teaching fundamental skills such as throwing, catching, cutting, and defensive positioning, while also introducing more advanced tactics and game scenarios. He believes in adapting his coaching approach to meet the individual needs and abilities of each player, ensuring that everyone has the opportunity to succeed and thrive.
            </p>

            <h4>Development</h4>
            <p>
              Beyond the Xs and Os of the game, Coach Aguiar prioritizes the development of his players, helping their confidence, leadership skills, and sense of belonging within the ultimate frisbee community. He serves as a mentor and role model, inspiring young athletes to reach their full potential both on and off the field.
            </p>

            <h4>Let&#39;s Play</h4>
            <p>
              With Coach Aguiar at the wheel, players not only improve their athletic abilities but also cultivate lifelong friendships, memories, and a deep appreciation for the sport of ultimate frisbee. His passion, dedication, and commitment to excellence make him a valued leader and mentor for youth ultimate frisbee players everywhere.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
