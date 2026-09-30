describe('One-time donations (localhost)', () => {
  function blockPayment () {
    cy.intercept('POST', '/api/donate', { statusCode: 400, body: { status: 'invalid', message: 'Unexpected test submission' } }).as('donate')
  }

  function watchPayment () {
    cy.intercept('POST', '/api/donate').as('donate')
  }

  function visit () {
    cy.visit('/donate')
  }

  function donorEmail () {
    return `danielprada2012+sflultimate-donate-test-${Math.floor(Math.random() * 10000)}@gmail.com`
  }

  function fillSandboxCard (number = '4111111111111111') {
    cy.get('#braintree-hosted-field-number', { timeout: 20000 }).should('be.visible')
    cy.iframe('#braintree-hosted-field-number').find('#credit-card-number').type('{selectall}{backspace}' + number)
    cy.iframe('#braintree-hosted-field-expirationDate').find('#expiration').type('{selectall}{backspace}0228')
    cy.iframe('#braintree-hosted-field-cvv').find('#cvv').type('{selectall}{backspace}123')
    cy.get('body').then($body => {
      if ($body.find('#braintree-hosted-field-postalCode').length) {
        cy.iframe('#braintree-hosted-field-postalCode').find('#postal-code').type('{selectall}{backspace}12345')
      }
    })
  }

  function completeCaptcha () {
    cy.get('iframe[title="reCAPTCHA"]', { timeout: 20000 }).should('be.visible')
    cy.iframe('iframe[title="reCAPTCHA"]').find('#recaptcha-anchor').click()
    cy.contains('button', 'Review donation', { timeout: 15000 }).should('not.be.disabled')
  }

  function fillDetails (details = {}) {
    const email = details.email || donorEmail()
    if (details.amount) {
      cy.get('#donation-amount').clear()
      cy.get('#donation-amount').type(details.amount)
    }
    if (details.from) {
      cy.get('#donation-from').clear()
      cy.get('#donation-from').type(details.from)
    }
    if (details.category) cy.get('#donation-category').select(details.category)
    cy.get('#donation-email').clear()
    cy.get('#donation-email').type(email)
    cy.get('#donation-street-address').clear()
    cy.get('#donation-street-address').type(details.streetAddress || '123 Test Way')
    if (details.message) {
      cy.get('#donation-message').clear()
      cy.get('#donation-message').type(details.message)
    }
    return email
  }

  it('offers presets and accepts the exact cap, defaulting to Anonymous', () => {
    blockPayment()
    visit()
    ;[10, 25, 50, 100, 250].forEach(amount => {
      cy.get('[aria-label="Suggested donation amounts"]').contains('button', new RegExp(`^\\$${amount}$`)).click()
      cy.get('#donation-amount').should('have.value', String(amount))
    })
    fillDetails()
    fillSandboxCard()
    completeCaptcha()
    cy.contains('button', 'Review donation').click()
    cy.get('[role="dialog"]').should('contain', 'Anonymous').and('contain', '$250.00')
    cy.get('@donate.all').should('have.length', 0)
    cy.contains('button', 'Cancel and edit').click()
  })

  it('blocks out-of-range, excess precision, missing email and invalid email', () => {
    blockPayment()
    visit()
    fillSandboxCard()
    completeCaptcha()
    cy.get('#donation-email').type('donor@example.test')
    cy.get('#donation-street-address').type('123 Test Way')
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

  it('cancels review, allows editing, and does not pay until the new snapshot is confirmed', () => {
    blockPayment()
    visit()
    fillDetails()
    fillSandboxCard()
    completeCaptcha()
    cy.contains('button', 'Review donation').click()
    cy.contains('button', 'Cancel and edit').click()
    cy.get('@donate.all').should('have.length', 0)
    cy.get('#donation-amount').clear()
    cy.get('#donation-amount').type('5.50')
    cy.get('#donation-message').type('Updated message')
    cy.contains('button', 'Review donation').click()
    cy.get('[role="dialog"]').should('contain', '$5.50').and('contain', 'Updated message')
    cy.get('@donate.all').should('have.length', 0)
    cy.contains('button', 'Cancel and edit').click()
  })

  it('prevents double submission and closing while processing a real payment', () => {
    cy.intercept('POST', '/api/donate', req => {
      req.on('response', res => {
        res.setDelay(1200)
      })
    }).as('donate')
    visit()
    const email = fillDetails({ amount: '5' })
    fillSandboxCard()
    completeCaptcha()
    cy.contains('button', 'Review donation').click()
    cy.contains('button', 'Confirm and donate').then($button => {
      $button[0].click()
      $button[0].click()
    })
    cy.contains('button', 'Processing donation').should('be.disabled')
    cy.get('[role="dialog"]').trigger('keydown', { key: 'Escape' })
    cy.get('[role="dialog"]').should('be.visible')
    cy.get('[role="dialog"] [aria-label="Close"]').should('be.disabled')
    cy.contains('button', 'Cancel and edit').should('be.disabled')
    cy.wait('@donate', { timeout: 30000 }).then(({ request, response }) => {
      expect(request.body.amount).to.equal('5.00')
      expect(request.body.email).to.equal(email)
      expect(request.body.paymentMethodNonce).to.be.a('string').and.not.equal('')
      expect(response.statusCode).to.equal(200)
      expect(response.body.status).to.equal('submitted')
    })
    cy.contains('[role="status"]', 'Thank you').should('be.visible')
    cy.get('@donate.all').should('have.length', 1)
  })

  it('allows an explicit new attempt only after a definite sandbox decline, with a fresh nonce and key', () => {
    watchPayment()
    visit()
    fillDetails({ amount: '5' })
    fillSandboxCard('4000111111111115')
    completeCaptcha()
    cy.contains('button', 'Review donation').click()
    cy.contains('button', 'Confirm and donate').click()
    let first
    cy.wait('@donate', { timeout: 30000 }).then(({ request, response }) => {
      first = request.body
      expect(response.body.status).to.equal('failed')
    })
    cy.get('[role="alert"]').should('be.visible')
    cy.contains('button', 'Review donation').should('be.disabled')
    fillSandboxCard()
    completeCaptcha()
    cy.contains('button', 'Review donation').click()
    cy.contains('button', 'Confirm and donate').click()
    cy.wait('@donate', { timeout: 30000 }).then(({ request, response }) => {
      expect(request.body.requestId).not.to.equal(first.requestId)
      expect(request.body.paymentMethodNonce).not.to.equal(first.paymentMethodNonce)
      expect(response.statusCode).to.equal(200)
      expect(response.body.status).to.equal('submitted')
    })
    cy.contains('[role="status"]', 'Thank you').should('be.visible')
  })

  ;['pending', 'needsReview', 'network'].forEach(status => {
    it(`blocks blind retries after ${status}, preserving the identity across refresh`, () => {
      cy.intercept('POST', '/api/donate', status === 'network'
        ? { forceNetworkError: true }
        : { statusCode: 409, body: { status, reference: 'review-reference', message: 'Check status' } }).as('donate')
      visit()
      fillDetails()
      fillSandboxCard()
      completeCaptcha()
      cy.contains('button', 'Review donation').click()
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
    cy.intercept('POST', '/api/donate', { delay: 60000, body: { status: 'submitted', reference: 'late', amount: 500, emailStatus: 'sent' } })
    visit()
    fillDetails({ amount: '5' })
    fillSandboxCard()
    completeCaptcha()
    cy.contains('button', 'Review donation').click()
    cy.clock()
    cy.contains('button', 'Confirm and donate').click()
    cy.contains('button', 'Processing donation').should('be.disabled')
    cy.tick(30001)
    cy.contains('[role="status"]', 'Please do not submit another donation').should('be.visible')
    cy.contains('button', 'Review donation').should('not.exist')
  })

  it('handles client-token failure without enabling donation', () => {
    cy.intercept('GET', '/api/donate', { statusCode: 503, body: { message: 'Unavailable' } })
    visit()
    cy.contains('[role="alert"]', 'temporarily unavailable').should('be.visible')
    cy.contains('button', 'Review donation').should('be.disabled')
  })

  it('links to donations in navigation', () => {
    blockPayment()
    visit()
    cy.get('header a[href="/donate"]').should('exist')
    cy.get('footer').should('have.length', 1)
    cy.get('footer a[href="/donate"]').should('have.length', 1)
  })

  it('traps dialog focus, cancels with Escape, and restores focus without payment', () => {
    blockPayment()
    visit()
    fillDetails()
    fillSandboxCard()
    completeCaptcha()
    cy.contains('button', 'Review donation').click()
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
    blockPayment()
    cy.viewport(375, 812)
    visit()
    fillDetails()
    fillSandboxCard()
    completeCaptcha()
    cy.contains('button', 'Review donation').click()
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

  it('reviews exact donor fields before sending one sandbox payment and shows confirmation', () => {
    watchPayment()
    visit()
    const email = fillDetails({
      from: 'Local player',
      category: 'Beginner Pick Up',
      message: 'Welcome new players!{enter}See you on the field.'
    })
    fillSandboxCard()
    completeCaptcha()
    cy.screenshot('donation-page', { capture: 'fullPage' })
    cy.contains('button', 'Review donation').click()
    cy.get('[role="dialog"]').should('contain', '$25.00').and('contain', 'Local player').and('contain', 'Beginner Pick Up').and('contain', email).and('contain', '123 Test Way').and('contain', 'Welcome new players!')
    cy.screenshot('donation-review', { capture: 'viewport' })
    cy.get('@donate.all').should('have.length', 0)
    cy.contains('button', 'Confirm and donate $25.00').click()
    cy.wait('@donate', { timeout: 30000 }).then(({ request, response }) => {
      expect(request.body).to.include({
        amount: '25.00',
        from: 'Local player',
        category: 'Beginner Pick Up',
        email,
        streetAddress: '123 Test Way',
        message: 'Welcome new players!\nSee you on the field.'
      })
      expect(request.body.paymentMethodNonce).to.be.a('string').and.not.equal('')
      expect(request.body.recaptchaToken).to.be.a('string').and.not.equal('')
      expect(request.body.requestId).to.match(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
      expect(response.statusCode).to.equal(200)
      expect(response.body.status).to.equal('submitted')
      expect(response.body.amount).to.equal(2500)
      cy.contains('[role="status"]', 'Thank you').should('contain', response.body.reference)
    })
    cy.get('@donate.all').should('have.length', 1)
  })
})
