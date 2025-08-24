let navLinks = []

const evergreenLinks = [
  { label: 'Local Pickups', key: 'community', href: '/pickups' },
  { label: 'Club & College Teams', key: 'club-teams', href: '/club-teams' },
  { label: 'Our Board', key: 'board', href: '/board' },
  { label: 'Events', key: 'events', href: '/events' },
  { label: 'News', key: 'events', href: '/news' }
  // { label: 'Beach Bash', key: 'beach-bash', href: '/beach-bash-tournament' }
]

navLinks = navLinks.concat(evergreenLinks)

const footerLinks = [
  { label: 'Terms & Conditions', key: 'terms', href: '/terms' },
  { label: 'Privacy Policy', key: 'privacy', href: '/privacy' }
].concat(evergreenLinks)

function HeaderNavigation (props) {
  const { section, league } = props

  let headerNavLinks = navLinks.slice()
  headerNavLinks.push({ label: 'Register', key: 'register', href: '/register' })
  if (league) {
    // if (league.canRegister) {
    //   headerNavLinks.push({ label: 'Register for ' + league.title, key: 'register', href: '/register' })
    // }

    if ((!league.isRegistrationPeriod && !league.isEarlyRegistrationPeriod) || league.isLateRegistrationPeriod) {
      headerNavLinks = headerNavLinks.concat([
        { label: 'Teams', key: 'teams', href: '/teams' },
        { label: 'Schedule', key: 'schedule', href: '/schedule' },
        { label: 'Stats', key: 'stats', href: '/stats' }
      ])
    }
  }

  const leagueNames = [
    'Spring League 2025',
    'Winter Beach League 2025',
    'Fall League 2024',
    'Spring League 2024',
    'Winter Beach League 2024',
    'Fall League 2023',
    'Spring League 2023',
    'Mini-Beach League 2023',
    'Fall League 2022',
    'Spring League 2022',
    'Fall League 2021',
    'Spring League 2017',
    'Fall League 2017',
    'Spring League 2016',
    'Fall League 2016'
  ]

  return (
    <header id="header" className="site-header">
      <div className="navbar-brand-container hidden-sm hidden-md hidden-lg mobile-logo">
        <a href="/">
          <img src="/images/sflultimate-logo-pink-flamingo.png" alt="South Florida Ultimate logo" />
        </a>
      </div>
      <div role="navigation" className="navbar navbar-inverse navbar-fixed-top">
        <div className="container-fluid">
          <div className="navbar-header">
            <button className="navbar-toggle" type="button" data-toggle="collapse" data-target=".navbar-collapse">
              <span className="sr-only">Toggle navigation</span>
              <span className="icon-bar"></span>
              <span className="icon-bar"></span>
              <span className="icon-bar"></span>
            </button>
            <div className="collapse navbar-collapse">
              <ul className="nav navbar-nav navbar-left">
                <li className="navbar-brand-container hidden-xs">
                  <a href="/" className="navbar-brand">
                    <img src="/images/sflultimate-logo-pink-flamingo.png" alt="South Florida Ultimate logo"/>
                  </a>
                </li>
                <li className="hidden-sm hidden-md hidden-lg">
                  <a href="/">Home</a>
                </li>
                {headerNavLinks.map((link) => {
                  if (link.key === 'stats' || link.key === 'schedule' || link.key === 'teams') {
                    return (
                      <li className="dropdown" key={link.key}>
                        <a className="dropdown-toggle" type="button" id="dropdownMenu1" data-toggle="dropdown" aria-haspopup="true" aria-expanded="true">
                          {link.label} {' '}
                          <span className="caret"></span>
                        </a>
                        <ul className="dropdown-menu" aria-labelledby="dropdownMenu1">
                          {
                            leagueNames.map((name) => {
                              const leagueUrl = `/leagues/${name.toLowerCase().replace(/ /g, '-')}/${link.key}`
                              return (
                                <li key={name}>
                                  <a href={leagueUrl}>{name}</a>
                                </li>
                              )
                            })
                          }
                        </ul>
                      </li>
                    )
                  }
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
