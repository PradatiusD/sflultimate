describe('Beach Bash', () => {
  it('fades in the hero logo after a one-second delay', () => {
    cy.visit('http://localhost:3000/beach-bash-tournament')
    cy.get('.beach-bash-hero img').should('have.css', 'transition-delay', '1s')
    cy.get('.beach-bash-hero img').should('have.css', 'transition-duration', '0.8s')
    cy.get('.beach-bash-hero img').then(($logo) => {
      const logo = $logo[0]
      const transition = logo.getAnimations().find(animation => animation.transitionProperty === 'opacity')
      expect(transition, 'opacity transition on page load').to.exist
      transition.pause()
      transition.currentTime = 500
      expect(Number(getComputedStyle(logo).opacity)).to.equal(0)
      transition.currentTime = 1400
      expect(Number(getComputedStyle(logo).opacity)).to.be.within(0.01, 0.99)
      transition.finish()
    })
    cy.get('.beach-bash-hero img').should('have.css', 'opacity', '1')
  })
  ;[{ width: 390, version: 'mobile' }, { width: 1440, version: 'desktop' }].forEach(({ width, version }) => {
    it(`selects the ${version} hero video`, () => {
      cy.viewport(width, 900)
      cy.visit('http://localhost:3000/beach-bash-tournament')
      cy.get('.alert-success[role="alert"]').should('not.exist')
      cy.get('.bash-video-background').should(($hero) => {
        const nav = $hero[0].ownerDocument.querySelector('#header nav')
        expect($hero[0].getBoundingClientRect().top).to.equal(nav.getBoundingClientRect().bottom)
      })
      cy.get('.bash-video-background video').should(($video) => {
        const video = $video[0]
        expect(video.currentSrc).to.equal(`https://d137pw2ndt5u9c.cloudfront.net/beach-bash-media/2026-${version}.mp4`)
        expect(video.autoplay).to.equal(true)
        expect(video.muted).to.equal(true)
        expect(video.loop).to.equal(true)
        expect(video.playsInline).to.equal(true)
        const bounds = video.getBoundingClientRect()
        const hero = video.parentElement.getBoundingClientRect()
        expect(bounds.left).to.equal(hero.left)
        expect(bounds.width).to.equal(hero.width)
        expect(bounds.height).to.equal(hero.height)
        expect(hero.width / hero.height).to.be.closeTo(version === 'mobile' ? 9 / 16 : 16 / 9, 0.001)
      })
    })
  })
  it('anchors the mobile logo and countdown to the bottom of the video', () => {
    cy.viewport(390, 844)
    cy.visit('http://localhost:3000/beach-bash-tournament')
    cy.get('.bash-video-background').should(($hero) => {
      const hero = $hero[0].getBoundingClientRect()
      const countdown = $hero[0].querySelector('.beach-countdown').getBoundingClientRect()
      const logo = $hero[0].querySelector('.beach-bash-hero img').getBoundingClientRect()
      expect(hero.bottom - countdown.bottom).to.be.within(15, 25)
      expect(logo.top).to.be.greaterThan(hero.top)
      expect(logo.bottom).to.be.lessThan(countdown.bottom)
    })
  })
  it('shows the 2027 dates and counts down to February 21 at 9 a.m. Eastern', () => {
    cy.clock(Date.parse('2027-02-20T14:00:00Z'), ['Date', 'setInterval', 'clearInterval'])
    cy.visit('http://localhost:3000/beach-bash-tournament')
    cy.title().should('contain', 'Beach Bash 2027')
    cy.get('.photo-copy h3').should('contain', 'February 21st - 22nd, 2027')
    cy.get('.beach-countdown strong').then(($values) => {
      expect($values.toArray().map(el => el.textContent)).to.deep.equal(['1', '0', '0', '0'])
    })
    cy.tick(1000)
    cy.get('.beach-countdown strong').then(($values) => {
      expect($values.toArray().map(el => el.textContent)).to.deep.equal(['0', '23', '59', '59'])
    })
  })
  it('restores navigation with Beach Bash branding on desktop and mobile', () => {
    cy.viewport(1440, 900)
    cy.visit('http://localhost:3000/beach-bash-tournament')
    cy.get('#header nav').should('be.visible')
    cy.get('.navbar-brand-centered img').should('be.visible').and('have.attr', 'src', '/images/beach-bash-2025-logo.svg')
    cy.get('.desktop-nav-shell').contains('Local Pickups').should('be.visible')
    cy.get('.desktop-nav-shell .league-menu-trigger').should('have.length.greaterThan', 0)
    cy.viewport(390, 844)
    cy.get('.mobile-logo img').should('be.visible').and('have.attr', 'src', '/images/beach-bash-2025-logo.svg')
    cy.get('.navbar-toggler').click()
    cy.get('#primaryNav').contains('Home').should('be.visible')
  })
})
