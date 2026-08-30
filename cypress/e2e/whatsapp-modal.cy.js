describe('WhatsApp verification modal', () => {
  it('opens the same verification modal from header and footer WhatsApp links', () => {
    cy.visit('http://localhost:3000/quiz')

    cy.get('a[href*="chat.whatsapp.com"]').should('not.exist')
    cy.get('header [data-community-whatsapp]').first().click({ force: true })
    cy.get('[role="dialog"]').should('be.visible').and('contain', 'Verify Before Opening WhatsApp')
    cy.get('[role="dialog"]').should('contain', 'answer 3 hand signal questions correctly')
    cy.get('[role="dialog"] .btn-close').click()

    cy.get('footer [data-community-whatsapp]').click({ force: true })
    cy.get('[role="dialog"]').should('be.visible').and('contain', 'Verify Before Opening WhatsApp')
  })
})
