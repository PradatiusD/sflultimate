const images = [
  { id: 'photo-1', title: 'First photo', caption: 'Opening point', altText: 'Players on the field', credit: 'Test photographer', assetType: 'image', file: { publicUrl: '/test-gallery/first.svg', filename: 'first.svg' } },
  { id: 'video-1', title: 'Video', assetType: 'video', file: { publicUrl: '/test-gallery/video.mp4', filename: 'video.mp4' } },
  { id: 'photo-2', title: 'Second photo', caption: 'Final point', altText: 'Players celebrating', credit: '', assetType: 'image', file: { publicUrl: '/test-gallery/second.svg', filename: 'second.svg' } }
]

function visitGallery (assets = images) {
  // Exercise the built gallery page with deterministic data, without writing to MongoDB.
  cy.intercept('/test-gallery/*.svg', {
    headers: { 'content-type': 'image/svg+xml' },
    body: '<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="1200"><rect width="1800" height="1200" fill="#287d69"/></svg>'
  })
  cy.intercept('GET', '/_next/data/**/gallery/lightbox-test.json*', {
    pageProps: {
      gallery: { id: 'lightbox-test', slug: 'lightbox-test', title: 'Lightbox test gallery', assets },
      leagues: []
    },
    __N_SSP: true
  }).as('galleryData')
  cy.visit('/quiz')
  cy.window().its('next.router').then(router => router.push('/gallery/lightbox-test'))
  cy.wait('@galleryData')
  cy.contains('h1', 'Lightbox test gallery').should('be.visible')
}

const currentSlide = '.yarl__slide_current'

describe('Gallery lightbox', () => {
  it('opens the clicked photo, excludes inline videos, and navigates with buttons and keys', () => {
    visitGallery()
    cy.get('.gallery-masonry video').should('have.length', 1).and('have.attr', 'controls')
    cy.get('button[aria-label="View Players celebrating"]').click()
    cy.get('[role="dialog"][aria-label="Lightbox"]').should('be.visible')
    cy.get(currentSlide).find('img').should('have.attr', 'alt', 'Players celebrating')
    cy.get('.yarl__counter').should('contain', '2 / 2')
    cy.get('.yarl__carousel').then($carousel => {
      cy.spy($carousel[0], 'animate').as('slideAnimation')
    })
    cy.get('button[aria-label="Previous"]').click()
    cy.get(currentSlide).should('contain', 'Opening point').and('contain', 'Credit: Test photographer')
    cy.get('.yarl__counter').should('contain', '1 / 2')
    cy.get('.yarl__container').trigger('keydown', { key: 'ArrowRight', code: 'ArrowRight' })
    cy.get(currentSlide).find('img').should('have.attr', 'alt', 'Players celebrating')
    cy.get('@slideAnimation').should('not.have.been.called')
    cy.get('button[aria-label="Close"]').click()
    cy.get('.yarl__root').should('not.exist')
    cy.get('button[aria-label="View Players celebrating"]').should('be.focused')
  })

  it('zooms, closes with Escape, and restores scrolling and focus', () => {
    visitGallery()
    cy.get('button[aria-label="View Players on the field"]').click()
    cy.get(currentSlide).find('img').should('have.prop', 'naturalWidth', 1800)
    cy.get('button[aria-label="Zoom in"]').should('not.be.disabled').click()
    cy.get('button[aria-label="Zoom out"]').should('not.be.disabled')
    cy.get('body').should('have.css', 'overflow', 'hidden')
    cy.get('.yarl__container').trigger('keydown', { key: 'Escape', code: 'Escape' })
    cy.get('.yarl__root').should('not.exist')
    cy.get('body').should('not.have.css', 'overflow', 'hidden')
    cy.get('button[aria-label="View Players on the field"]').should('be.focused')
  })

  it('supports swipe navigation on a mobile viewport', () => {
    cy.viewport('iphone-x')
    visitGallery()
    cy.get('button[aria-label="View Players on the field"]').click()
    cy.get(currentSlide).find('img').should('have.prop', 'naturalWidth', 1800)
    cy.get('.yarl__root').should('have.class', 'yarl__portal_open')
    cy.get('.yarl__container').should('be.focused').then($container => {
      const container = $container[0]
      const PointerEvent = container.ownerDocument.defaultView.PointerEvent
      for (const [type, clientX] of [['pointerdown', 300], ['pointermove', 250], ['pointermove', 60], ['pointerup', 60]]) {
        container.dispatchEvent(new PointerEvent(type, {
          bubbles: true, pointerId: 1, pointerType: 'touch', clientX, clientY: 300, buttons: type === 'pointerup' ? 0 : 1
        }))
      }
    })
    cy.get(currentSlide).find('img').should('have.attr', 'alt', 'Players celebrating')
    cy.get('.yarl__counter').should('contain', '2 / 2')
  })

  it('handles a single photo and an empty gallery', () => {
    visitGallery([images[0]])
    cy.get('button[aria-label="View Players on the field"]').click()
    cy.get('.yarl__counter').should('contain', '1 / 1')
    cy.get('button[aria-label="Next"]').should('not.exist')
    cy.get('button[aria-label="Close"]').click()
    visitGallery([])
    cy.contains('This gallery does not have any uploaded items yet.').should('be.visible')
    cy.get('.yarl__root').should('not.exist')
  })
})
