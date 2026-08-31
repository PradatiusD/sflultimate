describe('Captain draft room', () => {
  const url = 'http://127.0.0.1:3001/leagues/draft-browser-test/draftboard/captain/draft-browser-team-a'

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
    cy.contains('Jordan Reyes').should('be.visible')
    cy.get('body').should('not.contain.text', 'private-1@example.com')
    cy.get('body').should('not.contain.text', 'Private browser note 1')

    cy.on('window:confirm', () => true)
    cy.contains('tr', 'Jordan Reyes').within(() => {
      cy.contains('button', 'Pick').click()
    })

    cy.get('[data-cy="draft-status"]').should('contain.text', 'Test Waves are on the clock')
    cy.contains('.draft-room__roster', 'Jordan Reyes').should('be.visible')
    cy.contains('.draft-room__history', 'Jordan Reyes').should('be.visible')
  })
})
