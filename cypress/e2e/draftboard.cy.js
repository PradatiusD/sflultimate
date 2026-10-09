describe('Captain draft room', () => {
  const url = '/leagues/draft-browser-test/draftboard/captain/draft-browser-team-a'

  it('authenticates a captain and advances the live draft after a pick', () => {
    cy.visit(url)
    cy.contains('Test Flamingos draft room').should('be.visible')
    cy.get('#captain-password').type('wrong-password')
    cy.contains('Open draft room').click()
    cy.contains('Team or password is incorrect').should('be.visible')

    cy.get('#captain-password').clear()
    cy.get('#captain-password').type('draft-browser-password')
    cy.contains('Open draft room').click()

    cy.get('[data-cy="draft-status"]').should('contain.text', 'Your team is on the clock')
    cy.contains('Fixture Player 0').should('be.visible')
    cy.get('body').should('not.contain.text', 'fixture-0@example.invalid')
    cy.get('body').should('not.contain.text', 'Private fixture note')

    cy.reload()
    cy.get('[data-cy="draft-status"]').should('contain.text', 'Your team is on the clock')
    cy.get('.draft-room__players').should('have.class', 'card')
    cy.contains('tr', 'Fixture Player 0').within(() => {
      cy.contains('button', 'Pick').click()
    })
    cy.get('#draft-pick-confirm').should('be.visible').within(() => {
      cy.contains('button', 'Confirm pick').click()
    })

    cy.get('[data-cy="draft-status"]').should('contain.text', 'Test Waves are on the clock')
    cy.contains('.draft-room__roster', 'Fixture Player 0').should('be.visible')
    cy.contains('.draft-room__history', 'Fixture Player 0').should('be.visible')
    cy.viewport(390, 844)
    cy.get('.draft-room__players .table-responsive').should('be.visible')
    cy.document().then(document => {
      expect(document.documentElement.scrollWidth).to.be.at.most(390)
    })
    cy.screenshot('draftboard-captain-mobile', { capture: 'viewport' })
    cy.contains('button', 'Sign out').click()
    cy.contains('Open draft room').should('be.visible')
    cy.reload()
    cy.contains('Open draft room').should('be.visible')
    cy.request({ url: '/api/draft/state?league=draft-browser-test', failOnStatusCode: false }).its('status').should('eq', 401)
  })

  it('uses the Keystone commissioner login, controls, and read-only lists', () => {
    cy.request({
      method: 'POST',
      url: '/admin/api',
      log: false,
      body: {
        query: 'mutation ($email: String!, $password: String!) { authenticateUserWithPassword(email: $email, password: $password) { item { id } } }',
        variables: { email: 'draft-commissioner@example.invalid', password: 'draft-commissioner-password' }
      }
    }).then(response => {
      expect(response.body.errors).to.eq(undefined)
      expect(response.body.data.authenticateUserWithPassword.item.id).to.be.a('string')
    })
    cy.viewport(1440, 1000)
    cy.visit('/leagues/draft-browser-test/draftboard')
    cy.get('[data-cy="commissioner-controls"]').should('be.visible')
    cy.contains('button', 'Pause draft').click()
    cy.get('[data-cy="draft-status"]').should('contain.text', 'Draft paused')
    cy.contains('button', 'Resume draft').click()
    cy.get('[data-cy="draft-status"]').should('contain.text', 'Now drafting')
    cy.contains('button', 'Undo last pick').click()
    cy.get('#draft-admin-confirm').should('be.visible').within(() => cy.contains('button', 'Confirm').click())
    cy.contains('tr', 'Fixture Player 0').should('be.visible')
    cy.get('#draft-next-team').select('Test Waves')
    cy.contains('button', 'Apply').click()
    cy.get('[data-cy="draft-status"]').should('contain.text', 'Commissioner-adjusted turn')
    cy.document().then(document => {
      expect(document.documentElement.scrollWidth).to.be.at.most(1440)
    })
    cy.screenshot('draftboard-commissioner-desktop', { capture: 'viewport' })
    cy.request('POST', '/admin/api', { query: '{ allDraftSessions { id status } }' }).then(response => {
      expect(response.body.errors).to.eq(undefined)
      expect(response.body.data.allDraftSessions).to.have.length(1)
    })
    cy.visit(url)
    cy.contains('Open draft room').should('be.visible')
    cy.get('#captain-password').type('draft-browser-password', { log: false })
    cy.contains('Open draft room').click()
    cy.contains('Signed in for').should('be.visible')
    cy.reload()
    cy.contains('Signed in for').should('be.visible')
    cy.get('[data-cy="commissioner-controls"]').should('not.exist')
    cy.contains('button', 'Sign out').click()
    cy.visit('/leagues/draft-browser-test/draftboard')
    cy.get('[data-cy="commissioner-controls"]').should('be.visible')
  })
})
