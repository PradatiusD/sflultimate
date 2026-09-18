describe('One-time donations (mocked payment boundary)', () => {
  // Every test blocks the real payment API, even if it unexpectedly submits.
  beforeEach(() => {
    cy.intercept('POST', '/api/donate', { statusCode: 400, body: { status: 'invalid', message: 'Unexpected test submission' } })
  })

  function visit (tokenResponse = { clientToken: 'test-client-token' }) {
    cy.intercept('GET', '/api/donate', tokenResponse)
    cy.intercept('GET', 'https://js.braintreegateway.com/web/dropin/1.44.1/js/dropin.min.js', {
      fixture: 'donation-dropin.txt', headers: { 'content-type': 'application/javascript' }
    })
    cy.visit('/donate', {
      onBeforeLoad (win) {
        win.grecaptcha = {
          render (container, options) {
            const button = win.document.createElement('button')
            button.type = 'button'
            button.textContent = 'Complete test captcha'
            button.onclick = () => options.callback('test-captcha')
            container.appendChild(button)
            return 1
          },
          reset () {}
        }
      }
    })
  }

  function review () {
    cy.get('#donation-email').type('donor@example.test')
    cy.contains('Complete test captcha').click()
    cy.contains('button', 'Review donation').click()
  }

  it('offers presets and accepts the exact cap, defaulting to Anonymous', () => {
    cy.intercept('POST', '/api/donate', { status: 'submitted', reference: 'cap', amount: 25000, emailStatus: 'sent' }).as('donate')
    visit()
    ;[10, 25, 50, 100, 250].forEach(amount => {
      cy.get('[aria-label="Suggested donation amounts"]').contains('button', new RegExp(`^\\$${amount}$`)).click()
      cy.get('#donation-amount').should('have.value', String(amount))
    })
    review()
    cy.get('[role="dialog"]').should('contain', 'Anonymous').and('contain', '$250.00')
    cy.contains('button', 'Confirm and donate $250.00').click()
    cy.wait('@donate').its('request.body').should('include', { amount: '250.00', from: 'Anonymous' })
  })

  it('blocks out-of-range, excess precision, missing email and invalid email', () => {
    cy.intercept('POST', '/api/donate', { statusCode: 500 }).as('donate')
    visit()
    cy.contains('Complete test captcha').click()
    cy.get('#donation-email').type('donor@example.test')
    ;['4.99', '250.01', '251', '5.001', '0', '-10'].forEach(amount => {
      cy.get('#donation-amount').clear()
      cy.get('#donation-amount').type(amount)
      cy.contains('button', 'Review donation').click()
      cy.get('[role="dialog"]').should('not.exist')
    })
    cy.get('#donation-amount').clear()
    cy.get('#donation-amount').type('5')
    cy.get('#donation-email').clear()
    cy.contains('button', 'Review donation').click()
    cy.get('[role="dialog"]').should('not.exist')
    cy.get('#donation-email').type('not-an-email')
    cy.contains('button', 'Review donation').click()
    cy.get('[role="dialog"]').should('not.exist')
    cy.get('@donate.all').should('have.length', 0)
    cy.get('#donation-from').should('have.attr', 'maxlength', '100')
    cy.get('#donation-message').should('have.attr', 'maxlength', '1000')
  })

  it('cancels review, allows editing, and submits only the newly reviewed snapshot', () => {
    cy.intercept('POST', '/api/donate', { status: 'submitted', reference: 'edited', amount: 550, emailStatus: 'sent' }).as('donate')
    visit()
    review()
    cy.contains('button', 'Cancel and edit').click()
    cy.get('@donate.all').should('have.length', 0)
    cy.get('#donation-amount').clear()
    cy.get('#donation-amount').type('5.50')
    cy.get('#donation-message').type('Updated message')
    cy.contains('button', 'Review donation').click()
    cy.get('[role="dialog"]').should('contain', '$5.50').and('contain', 'Updated message')
    cy.contains('button', 'Confirm and donate $5.50').click()
    cy.wait('@donate').its('request.body').should('include', { amount: '5.50', message: 'Updated message' })
  })

  it('prevents double submission and closing while processing', () => {
    cy.intercept('POST', '/api/donate', { delay: 1200, body: { status: 'submitted', reference: 'once', amount: 2500, emailStatus: 'sent' } }).as('donate')
    visit()
    review()
    cy.contains('button', 'Confirm and donate').then($button => {
      $button[0].click()
      $button[0].click()
    })
    cy.contains('button', 'Processing donation').should('be.disabled')
    cy.get('[role="dialog"]').trigger('keydown', { key: 'Escape' })
    cy.get('[role="dialog"]').should('be.visible')
    cy.get('[role="dialog"] [aria-label="Close"]').should('be.disabled')
    cy.contains('button', 'Cancel and edit').should('be.disabled')
    cy.wait('@donate')
    cy.contains('[role="status"]', 'Thank you').should('be.visible')
    cy.get('@donate.all').should('have.length', 1)
  })

  it('keeps successful payment successful when the confirmation email fails', () => {
    cy.intercept('POST', '/api/donate', { status: 'submitted', reference: 'email-failed', amount: 2500, emailStatus: 'failed' }).as('donate')
    visit()
    review()
    cy.contains('button', 'Confirm and donate').click()
    cy.wait('@donate')
    cy.contains('[role="status"]', 'payment succeeded').should('contain', 'email has not been delivered').and('contain', 'do not donate again')
    cy.contains('button', 'Review donation').should('not.exist')
  })

  it('allows an explicit new attempt only after a definite decline, with a fresh nonce and key', () => {
    let first
    cy.intercept('POST', '/api/donate', { statusCode: 422, body: { status: 'failed', message: 'Payment declined. No charge was made.' } }).as('decline')
    visit()
    review()
    cy.contains('button', 'Confirm and donate').click()
    cy.wait('@decline').then(({ request }) => { first = request.body })
    cy.contains('[role="alert"]', 'Payment declined').should('be.visible')
    cy.contains('button', 'Review donation').should('be.disabled')
    cy.intercept('POST', '/api/donate', { status: 'submitted', reference: 'retry', amount: 2500, emailStatus: 'sent' }).as('retry')
    cy.contains('Complete test captcha').click()
    cy.contains('button', 'Review donation').click()
    cy.contains('button', 'Confirm and donate').click()
    cy.wait('@retry').then(({ request }) => {
      expect(request.body.requestId).not.to.equal(first.requestId)
      expect(request.body.paymentMethodNonce).not.to.equal(first.paymentMethodNonce)
    })
  })

  ;['pending', 'needsReview', 'network'].forEach(status => {
    it(`blocks blind retries after ${status}, preserving the identity across refresh`, () => {
      cy.intercept('POST', '/api/donate', status === 'network'
        ? { forceNetworkError: true }
        : { statusCode: 409, body: { status, reference: 'review-reference', message: 'Check status' } }).as('donate')
      visit()
      review()
      cy.contains('button', 'Confirm and donate').click()
      cy.wait('@donate')
      cy.contains('[role="status"]', 'Please do not submit another donation').should('be.visible')
      cy.window().then(win => {
        const saved = JSON.parse(win.localStorage.getItem('sfu-donation-attempt'))
        expect(saved.requestId).to.match(/^[0-9a-f-]{36}$/)
        expect(Object.keys(saved)).not.to.include.members(['email', 'from', 'message', 'paymentMethodNonce', 'recaptchaToken'])
        cy.reload()
        cy.contains('[role="status"]', saved.reference || saved.requestId).should('be.visible')
      })
      cy.contains('button', 'Review donation').should('not.exist')
      cy.get('@donate.all').then(requests => {
        // Chromium may replay a transport-failed POST itself. All such replays
        // must carry the same identity, so the server can deduplicate them.
        expect(new Set(requests.map(item => item.request.body.requestId)).size).to.equal(1)
        if (status !== 'network') expect(requests).to.have.length(1)
      })
    })
  })

  it('stops waiting on an unresponsive server without permitting another payment', () => {
    cy.intercept('POST', '/api/donate', { delay: 60000, body: { status: 'submitted', reference: 'late', amount: 2500, emailStatus: 'sent' } })
    visit()
    review()
    cy.clock()
    cy.contains('button', 'Confirm and donate').click()
    cy.contains('button', 'Processing donation').should('be.disabled')
    cy.tick(30001)
    cy.contains('[role="status"]', 'Please do not submit another donation').should('be.visible')
    cy.contains('button', 'Review donation').should('not.exist')
  })

  it('handles client-token failure without enabling donation', () => {
    visit({ statusCode: 503, body: { message: 'Unavailable' } })
    cy.contains('[role="alert"]', 'temporarily unavailable').should('be.visible')
    cy.contains('button', 'Review donation').should('be.disabled')
  })

  it('links to donations in navigation', () => {
    visit()
    cy.get('header a[href="/donate"]').should('exist')
    cy.get('footer').should('have.length', 1)
    cy.get('footer a[href="/donate"]').should('have.length', 1)
  })

  it('traps dialog focus, cancels with Escape, and restores focus without payment', () => {
    cy.intercept('POST', '/api/donate', { statusCode: 500 }).as('donate')
    visit()
    review()
    cy.get('[role="dialog"]').should('have.attr', 'aria-labelledby', 'donation-review-title')
    cy.focused().should('have.attr', 'aria-label', 'Close')
    cy.focused().trigger('keydown', { key: 'Tab', shiftKey: true })
    cy.focused().should('contain', 'Confirm and donate')
    cy.focused().trigger('keydown', { key: 'Tab' })
    cy.focused().should('have.attr', 'aria-label', 'Close')
    cy.focused().trigger('keydown', { key: 'Escape' })
    cy.get('[role="dialog"]').should('not.exist')
    cy.focused().should('contain', 'Review donation')
    cy.get('@donate.all').should('have.length', 0)
  })

  it('keeps the review controls usable on a narrow mobile viewport', () => {
    cy.viewport(375, 812)
    visit()
    review()
    cy.contains('button', 'Confirm and donate $25.00').scrollIntoView()
    cy.contains('button', 'Confirm and donate $25.00').should('be.visible')
    cy.get('[role="dialog"]').then($dialog => {
      expect($dialog[0].scrollWidth).to.be.at.most(375)
    })
    cy.screenshot('donation-review-mobile', { capture: 'viewport' })
    cy.contains('button', 'Cancel and edit').click()
    cy.get('[role="dialog"]').should('not.exist')
  })

  it('rejects an over-cap direct API request and denies public donation-list reads', () => {
    cy.request({
      method: 'POST',
      url: '/api/donate',
      failOnStatusCode: false,
      headers: { Origin: Cypress.config('baseUrl') },
      body: { amount: '250.01', from: 'Test', email: 'donor@example.test', message: '', requestId: '4cd6aee8-71de-4166-a4b9-fb4a1b60b701', paymentMethodNonce: 'must-not-be-used', recaptchaToken: 'must-not-be-used' }
    }).then(response => {
      expect(response.status).to.equal(400)
      expect(response.body.status).to.equal('invalid')
    })
    cy.request({ method: 'POST', url: '/admin/api', body: { query: '{ allDonations { id from email amount } }' } }).then(response => {
      expect(response.body.errors).to.have.length.greaterThan(0)
      expect(response.body.data.allDonations).to.equal(null)
    })
  })

  it('reviews exact donor fields before sending one payment and shows confirmation', () => {
    cy.intercept('POST', '/api/donate', { status: 'submitted', reference: 'donation-test', amount: 2500, emailStatus: 'sent' }).as('donate')
    visit()
    cy.get('#donation-email').type('donor@example.test')
    cy.get('#donation-from').type('Local player')
    cy.get('#donation-message').type('Welcome new players!{enter}See you on the field.')
    cy.contains('Complete test captcha').click()
    cy.screenshot('donation-page', { capture: 'fullPage' })
    cy.contains('button', 'Review donation').click()
    cy.get('[role="dialog"]').should('contain', '$25.00').and('contain', 'Local player').and('contain', 'donor@example.test').and('contain', 'Welcome new players!')
    cy.screenshot('donation-review', { capture: 'viewport' })
    cy.get('@donate.all').should('have.length', 0)
    cy.contains('button', 'Confirm and donate $25.00').click()
    cy.wait('@donate').its('request.body').should('include', {
      amount: '25.00', from: 'Local player', email: 'donor@example.test', message: 'Welcome new players!\nSee you on the field.', paymentMethodNonce: 'test-nonce-1', recaptchaToken: 'test-captcha'
    }).its('requestId').should('match', /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
    cy.contains('[role="status"]', 'Thank you').should('contain', 'donation-test').and('contain', 'confirmation email')
    cy.get('@donate.all').should('have.length', 1)
  })
})
