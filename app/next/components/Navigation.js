'use server'
import Notification from './Notification'
let navLinks = []

const evergreenLinks = [
  { label: 'Local Pickups', key: 'community', href: '/pickups' },
  { label: 'Events', key: 'events', href: '/events' },
  { label: 'News', key: 'news', href: '/news' },
  { label: 'Club & College Teams', key: 'club-teams', href: '/club-teams' },
  { label: 'Our Board', key: 'board', href: '/board' },
  { label: 'Youth', key: 'youth', href: '/youth' },
  { label: 'Beach Bash', key: 'beach-bash', href: '/beach-bash-tournament' }
]

navLinks = navLinks.concat(evergreenLinks)

const footerLinks = [
  { label: 'Terms & Conditions', key: 'terms', href: '/terms' },
  { label: 'Privacy Policy', key: 'privacy', href: '/privacy' }
].concat(evergreenLinks)

const socialLinks = [
  { key: 'instagram', label: 'Instagram', href: 'https://www.instagram.com/sflultimate/', iconClassName: 'fa-brands fa-instagram' },
  { key: 'youtube', label: 'YouTube', href: 'https://www.youtube.com/sflultimate/', iconClassName: 'fa-brands fa-youtube' },
  { key: 'tiktok', label: 'TikTok', href: 'https://www.tiktok.com/@sflultimate', iconClassName: 'fa-brands fa-tiktok' },
  { key: 'facebook', label: 'Facebook', href: 'https://www.facebook.com/sflultimate/', iconClassName: 'fa-brands fa-facebook' }
]

const leagueSections = [
  { label: 'Teams', key: 'teams' },
  { label: 'Schedule', key: 'schedule' },
  { label: 'Stats', key: 'stats' }
]

function HeaderNavigation (props) {
  const { section, leagues } = props

  const headerNavLinks = navLinks.slice()
  if (Array.isArray(leagues) && leagues.find(l => l.active)) {
    headerNavLinks.unshift({ label: 'Register', key: 'register', href: '/register' })
  }
  headerNavLinks.push({ label: 'Leagues', key: 'leagues', href: '/leagues' })
  const primaryNavLinks = headerNavLinks
  const leftNavLinks = primaryNavLinks.slice(0, Math.ceil(primaryNavLinks.length / 2))
  const rightNavLinks = primaryNavLinks.slice(Math.ceil(primaryNavLinks.length / 2))

  function renderStandardLink (link, extraClassName = '') {
    const className = `nav-link${section === link.key ? ' active' : ''}${extraClassName ? ` ${extraClassName}` : ''}`
    return (
      <a href={link.href} className={className}>
        {link.label} {link.key === 'register' && <span className="badge bg-success">OPEN</span>}
      </a>
    )
  }

  function renderExternalNavLink (link, iconOnly = false) {
    return (
      <li key={link.key} className="nav-item">
        {renderSocialLinkAnchor(link, iconOnly)}
      </li>
    )
  }

  function renderSocialLinkAnchor (link, iconOnly = false) {
    return (
      <a
        key={link.key}
        className={`nav-link${iconOnly ? ' nav-social-link' : ''}`}
        href={link.href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={link.label}
        title={link.label}
      >
        {iconOnly
          ? (
            link.iconClassName
              ? <i className={`fa ${link.iconClassName}`} aria-hidden="true"></i>
              : <span className="nav-social-badge" aria-hidden="true">{link.badgeLabel}</span>
            )
          : link.label}
      </a>
    )
  }

  function renderLeagueDropdown (link, desktop = false) {
    const dropdownId = `${link.key}-${desktop ? 'desktop' : 'mobile'}-dropdown-menu`
    return (
      <li className={`nav-item dropdown${desktop ? ' nav-item-mega' : ''}`} key={dropdownId}>
        <a
          className={`nav-link dropdown-toggle${section === link.key ? ' active' : ''}`}
          href="#"
          id={dropdownId}
          role="button"
          data-bs-toggle="dropdown"
          aria-expanded="false"
        >
          {link.label}
        </a>
        <ul className={`dropdown-menu${desktop ? ' dropdown-menu-mega' : ''}`} aria-labelledby={dropdownId}>
          {leagues && leagues.map(({ slug, title }) => (
            <li key={slug} className={`league-menu-group${desktop ? ' league-menu-group-desktop' : ''}`}>
              <a className="dropdown-item league-menu-trigger" href={`/leagues/${slug}/teams`}>
                <span>{title}</span>
                <span className="league-menu-chevron" aria-hidden="true">›</span>
              </a>
              <ul className="league-menu-list">
                {leagueSections.map((sectionLink) => (
                  <li key={`${slug}-${sectionLink.key}`}>
                    <a className="dropdown-item league-menu-child-link" href={`/leagues/${slug}/${sectionLink.key}`}>
                      {sectionLink.label}
                    </a>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </li>
    )
  }

  return (
    <>
      <header id="header" className="site-header">
        <div className="navbar-brand-container d-xl-none mobile-logo">
          <a href="/" aria-label="South Florida Ultimate home">
            <img className="img-fluid" src="/images/sflultimate-logo-pink-flamingo.png" alt="South Florida Ultimate logo" />
          </a>
        </div>
        <nav className="navbar navbar-dark bg-dark fixed-top navbar-expand-xl" role="navigation">
          <div className="container-fluid">
            <button
              className="navbar-toggler"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#primaryNav"
              aria-controls="primaryNav"
              aria-expanded="false"
              aria-label="Toggle navigation"
            >
              <span className="navbar-toggler-icon"></span>
            </button>
            <div className="collapse navbar-collapse" id="primaryNav">
              <div className="w-100 d-xl-none">
                <ul className="navbar-nav mb-2 mb-lg-0 pt-4">
                  <li className="nav-item">
                    <a className="nav-link" href="/">Home</a>
                  </li>
                  {
                    primaryNavLinks.map((link) => {
                      if (link.key === 'leagues') {
                        return renderLeagueDropdown(link)
                      }

                      return (
                        <li key={link.key} className="nav-item">
                          {renderStandardLink(link)}
                        </li>
                      )
                    })
                  }
                  <li className="nav-item nav-mobile-social-row">
                    {socialLinks.map((link) => renderSocialLinkAnchor(link, true))}
                  </li>
                </ul>
              </div>

              <div className="desktop-nav-shell d-none d-xl-flex">
                <ul className="navbar-nav desktop-nav-group desktop-nav-group-left">
                  {leftNavLinks.map((link) => {
                    if (link.key === 'leagues') {
                      return renderLeagueDropdown(link, true)
                    }

                    return (
                      <li key={link.key} className="nav-item">
                        {renderStandardLink(link)}
                      </li>
                    )
                  })}
                </ul>
                <a href="/" className="navbar-brand navbar-brand-centered" aria-label="South Florida Ultimate home">
                  <img src="/images/sflultimate-logo-pink-flamingo.png" alt="South Florida Ultimate logo"/>
                </a>
                <ul className="navbar-nav desktop-nav-group desktop-nav-group-right">
                  {rightNavLinks.map((link) => {
                    if (link.key === 'leagues') {
                      return renderLeagueDropdown(link, true)
                    }

                    return (
                      <li key={link.key} className="nav-item">
                        {renderStandardLink(link)}
                      </li>
                    )
                  })}
                  {socialLinks.map((link) => renderExternalNavLink(link, true))}
                </ul>
              </div>
            </div>
          </div>
        </nav>
      </header>
      <Notification leagues={leagues} />
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
                {socialLinks.map((link) => (
                  <a
                    key={link.key}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={link.label}
                    title={link.label}
                    className={link.badgeLabel ? 'social-badge' : ''}
                  >
                    {link.iconClassName
                      ? <i className={`fa ${link.iconClassName}`}></i>
                      : <span>{link.badgeLabel}</span>}
                  </a>
                ))}
                <a href="mailto:sflultimate@gmail.com" target="_blank" rel="noopener noreferrer">
                  <i className="fa fa-solid fa-envelope"></i>
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
