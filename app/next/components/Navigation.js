import Notification from './Notification'
let navLinks = []

const evergreenLinks = [
  { label: 'Local Pickups', key: 'community', href: '/pickups' },
  { label: 'Club & College Teams', key: 'club-teams', href: '/club-teams' },
  { label: 'Our Board', key: 'board', href: '/board' },
  { label: 'Events', key: 'events', href: '/events' },
  { label: 'News', key: 'news', href: '/news' },
  { label: 'Youth', key: 'youth', href: '/youth' },
  { label: 'Beach Bash', key: 'beach-bash', href: '/beach-bash-tournament' }
]

navLinks = navLinks.concat(evergreenLinks)

const footerLinks = [
  { label: 'Terms & Conditions', key: 'terms', href: '/terms' },
  { label: 'Privacy Policy', key: 'privacy', href: '/privacy' }
].concat(evergreenLinks)

function HeaderNavigation (props) {
  const { section } = props

  let headerNavLinks = navLinks.slice()
  headerNavLinks.push({ label: 'Register', key: 'register', href: '/register' })
  headerNavLinks = headerNavLinks.concat([
    // { label: 'Teams', key: 'teams', href: '/teams' },
    // { label: 'Schedule', key: 'schedule', href: '/schedule' },
    // { label: 'Stats', key: 'stats', href: '/stats' }
  ])

  const leagueNames = [
    'Fall League 2025 - Mixed Division',
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
    <>
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
                  {
                    headerNavLinks.map((link) => {
                      const dropdownId = link.key + '-dropdown-menu'
                      if (link.key === 'stats' || link.key === 'schedule' || link.key === 'teams') {
                        return (
                        <li className="dropdown" key={link.key}>
                          <a className="dropdown-toggle" type="button" id={dropdownId} data-toggle="dropdown" aria-haspopup="true" aria-expanded="true">
                            {link.label} {' '}
                            <span className="caret"></span>
                          </a>
                          <ul className="dropdown-menu" aria-labelledby={dropdownId}>
                            {
                              leagueNames.map((name) => {
                                const slug = name.toLowerCase()
                                  .replace(/\s+-+/g, '')
                                  .replace(/\s/g, '-')

                                const leagueUrl = `/leagues/${slug}/${link.key}`
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
                        <a href={link.href}>{link.label} {link.key === 'register' && <span className="badge text-success" style={{ background: 'green' }}>OPEN</span>}</a>
                      </li>
                      )
                    })}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </header>
      <Notification />
    </>
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
                <a href="https://www.youtube.com/sflultimate/" target="_blank" rel="noopener noreferrer">
                  <i className="fa fa-youtube-play"></i>
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
