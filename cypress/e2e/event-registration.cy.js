describe('Event registration (localhost)', () => {
  function createEvent (data = {}) {
    const slug = `cypress-event-reg-${Date.now()}-${Math.random().toString(16).slice(2)}`
    const eventData = {
      name: data.name || 'Cypress Clinic',
      slug,
      location: 'Test Park',
      description: '<p>Cypress event</p>',
      startTime: new Date(Date.now() + 86400000).toISOString(),
      endTime: new Date(Date.now() + 172800000).toISOString(),
      allowRegistrations: data.allowRegistrations !== false
    }
    if (data.registrationPrice !== undefined) eventData.registrationPrice = data.registrationPrice
    else if (data.allowRegistrations !== false) eventData.registrationPrice = 25

    return cy.request({
      method: 'POST',
      url: '/admin/api',
      body: {
        query: 'mutation ($data: EventCreateInput!) { createEvent(data: $data) { id slug name } }',
        variables: { data: eventData }
      }
    }).then(response => {
      expect(response.body.errors, JSON.stringify(response.body.errors || [])).to.equal(undefined)
      expect(response.body.data.createEvent.slug).to.equal(slug)
      return response.body.data.createEvent
    })
  }

  function fillDetails (details = {}) {
    const email = details.email || `danielprada2012+sflultimate-event-test-${Math.floor(Math.random() * 10000)}@gmail.com`
    cy.get('#event-registration-name').clear()
    cy.get('#event-registration-name').type(details.name || 'Alex Player')
    cy.get('#event-registration-email').clear()
    cy.get('#event-registration-email').type(email)
    cy.get('body').then($body => {
      if ($body.find('#event-registration-street-address').length) {
        cy.get('#event-registration-street-address').clear()
        cy.get('#event-registration-street-address').type(details.streetAddress || '123 Test Way')
      }
    })
    if (details.comments) {
      cy.get('#event-registration-comments').clear()
      cy.get('#event-registration-comments').type(details.comments)
    }
    return email
  }

  function fillSandboxCard () {
    cy.get('#braintree-hosted-field-number', { timeout: 20000 }).should('be.visible')
    cy.iframe('#braintree-hosted-field-number').find('#credit-card-number').type('4111111111111111')
    cy.iframe('#braintree-hosted-field-expirationDate').find('#expiration').type('02 28')
    cy.iframe('#braintree-hosted-field-cvv').find('#cvv').type('123')
    cy.get('body').then($body => {
      if ($body.find('#braintree-hosted-field-postalCode').length) {
        cy.iframe('#braintree-hosted-field-postalCode').find('#postal-code').type('12345')
      }
    })
  }

  it('hides the form when registrations are not allowed', () => {
    createEvent({ allowRegistrations: false, registrationPrice: 25 }).then(event => {
      cy.visit(`/events/${event.slug}`)
      cy.contains('button', 'Review registration').should('not.exist')
      cy.get('#event-registration-email').should('not.exist')
    })
  })

  it('registers a free event on the running server', () => {
    cy.intercept('POST', '/api/event-registration').as('register')
    createEvent({ registrationPrice: 0, name: 'Free Cypress Clinic' }).then(event => {
      cy.visit(`/events/${event.slug}`)
      cy.contains('This event is free to register.').should('be.visible')
      cy.contains('Payment details').should('not.exist')
      fillDetails({ comments: 'See you there' })
      cy.contains('button', 'Review registration').click()
      cy.get('[role="dialog"]').should('contain', 'Alex Player').and('contain', 'See you there')
      cy.get('@register.all').should('have.length', 0)
      cy.contains('button', 'Confirm registration').click()
      cy.wait('@register').its('response.statusCode').should('eq', 200)
      cy.contains('[role="status"]', 'You are registered for Free Cypress Clinic', { timeout: 30000 }).should('be.visible')
      cy.reload()
      cy.contains('h2', '1 person is going').should('be.visible')
      cy.get('.event-registration-attendee').should('have.length', 1).and('contain', 'Alex P.')
      cy.get('.event-registration-latest-track').invoke('css', 'animation-name').should('match', /^event-registration-latest-loop/).get('.event-registration-latest-track').should('contain', 'Alex P.').find('small').first().invoke('text').should('match', /^(just now|.*ago)$/)
    })
  })

  it('registers a paid event through Braintree on the running server', () => {
    cy.intercept('POST', '/api/event-registration').as('register')
    createEvent({ registrationPrice: 25, name: 'Paid Cypress Clinic' }).then(event => {
      cy.visit(`/events/${event.slug}`)
      cy.contains('Registration is $25 USD').should('be.visible')
      fillDetails({ comments: 'Need a ride' })
      fillSandboxCard()
      cy.contains('button', 'Review registration').click()
      cy.get('[role="dialog"]').should('contain', '$25.00').and('contain', 'Alex Player').and('contain', '123 Test Way').and('contain', 'Need a ride')
      cy.get('@register.all').should('have.length', 0)
      cy.contains('button', 'Confirm and pay $25.00').click()
      cy.wait('@register', { timeout: 30000 }).then(({ request, response }) => {
        expect(request.body.name).to.equal('Alex Player')
        expect(request.body.comments).to.equal('Need a ride')
        expect(request.body.streetAddress).to.equal('123 Test Way')
        expect(request.body.eventId).to.equal(event.id)
        expect(request.body.amountPaid).to.equal(25)
        expect(request.body.paymentMethodNonce).to.be.a('string').and.not.equal('')
        expect(response.statusCode).to.equal(200)
        expect(response.body.status).to.equal('submitted')
      })
      cy.contains('[role="status"]', 'You are registered for Paid Cypress Clinic').should('contain', '$25.00')
    })
  })

  it('blocks missing name or email and does not submit', () => {
    cy.intercept('POST', '/api/event-registration').as('register')
    createEvent({ registrationPrice: 0 }).then(event => {
      cy.visit(`/events/${event.slug}`)
      cy.contains('button', 'Review registration').click()
      cy.get('[role="dialog"]').should('not.exist')
      cy.get('#event-registration-name').type('Alex Player')
      cy.contains('button', 'Review registration').click()
      cy.get('[role="dialog"]').should('not.exist')
      cy.get('@register.all').should('have.length', 0)
    })
  })

  it('cancels review without submitting to the server', () => {
    cy.intercept('POST', '/api/event-registration').as('register')
    createEvent({ registrationPrice: 0 }).then(event => {
      cy.visit(`/events/${event.slug}`)
      fillDetails()
      cy.contains('button', 'Review registration').click()
      cy.contains('button', 'Cancel and edit').click()
      cy.get('[role="dialog"]').should('not.exist')
      cy.get('@register.all').should('have.length', 0)
    })
  })

  it('rejects public event-registration list reads', () => {
    cy.request({ method: 'POST', url: '/admin/api', body: { query: '{ allEventRegistrations { id name email amountPaid } }' } }).then(response => {
      expect(response.body.errors).to.have.length.greaterThan(0)
      expect(response.body.data.allEventRegistrations).to.equal(null)
    })
  })
})
