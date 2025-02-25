let navLinks = []

const evergreenLinks = [
  { label: 'Local Pickups', key: 'community', href: '/pickups' },
  { label: 'Club & College Teams', key: 'club-teams', href: '/club-teams' },
  { label: 'Our Board', key: 'board', href: '/board' },
  { label: 'Events', key: 'events', href: '/events' },
  { label: 'Beach Bash', key: 'beach-bash', href: '/beach-bash-tournament' }
]

navLinks = navLinks.concat(evergreenLinks)

const footerLinks = [
  { label: 'Terms & Conditions', key: 'terms', href: '/terms' },
  { label: 'Privacy Policy', key: 'privacy', href: '/privacy' }
].concat(evergreenLinks)

function HeaderNavigation (props) {
  const { section, league } = props

  let headerNavLinks = navLinks.slice()

  if (league) {
    if (league.canRegister) {
      headerNavLinks.push({ label: 'Register for ' + league.title, key: 'register', href: '/register' })
    }

    if (!league.isRegistrationPeriod || league.isLateRegistrationPeriod) {
      headerNavLinks = headerNavLinks.concat([
        { label: 'Teams', key: 'teams', href: '/teams' },
        { label: 'Schedule', key: 'schedule', href: '/schedule' },
        { label: 'Stats', key: 'stats', href: '/stats' }
      ])
    }
  }

  return (
    <header id="header" className="site-header">
      <div role="navigation" className="navbar navbar-inverse">
        <div className="container-fluid">
          <a href="/" className="navbar-brand">
            <img src={(section === 'register-tournament') ? '/images/south-florida-2020-final-optimized.png'
              : '/images/logo-skyline.png'} alt=""/>
          </a>
          <div className="navbar-header">
            <button className="navbar-toggle" type="button" data-toggle="collapse" data-target=".navbar-collapse">
              <span className="sr-only">Toggle navigation</span>
              <span className="icon-bar"></span>
              <span className="icon-bar"></span>
              <span className="icon-bar"></span>
            </button>
            <div className="collapse navbar-collapse">
            <ul className="nav navbar-nav navbar-left">
                {headerNavLinks.map((link) => {
                  return (
                    <li key={link.key} className={section === link.key ? 'active' : null}>
                      <a href={link.href}>{link.label}</a>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

function FooterNavigation (props) {
  const { section } = props
  return (
    <div>
      <footer className="site-footer">
        <div className="container">
          <div className="row">
            <div className="col-sm-8">
              <br/>
              <div>
                <a href="https://www.instagram.com/sflultimate/" target="_blank" rel="noopener noreferrer">
                  <i className="fa fa-instagram"></i>
                </a>
                <a href="https://www.facebook.com/sflultimate/" target="_blank" rel="noopener noreferrer">
                  <i className="fa fa-facebook"></i>
                </a>
                <a href="mailto:sflultimate@gmail.com" target="_blank" rel="noopener noreferrer">
                  <i className="fa fa-envelope"></i>
                </a>
              </div>
              <br/>
              <span></span>
              <br/>
            </div>
            <div className="col-sm-4">
              <h4>Links</h4>
              <ul>
                {footerLinks.map((link) => (
                  <li key={link.key} className={section === link.key ? 'active' : null}>
                    <a href={link.href}>{link.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </footer>
      <div className="text-right credits">
        <div className="container">
          Organized by South Florida Ultimate Inc., a local non-for-profit.
        </div>
      </div>
    </div>
  )
}

export {
  HeaderNavigation,
  FooterNavigation
}
