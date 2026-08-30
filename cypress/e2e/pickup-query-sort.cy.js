describe('Pickup ZIP query sorting', () => {
  it('initializes pickup distance sorting from the zip query string', () => {
    cy.visit('http://localhost:3000/pickups?zip=33301')

    cy.get('#pickup-zip-code').should('have.value', '33301')
    cy.contains('Sorted by distance from 33301.').should('be.visible')
  })
})
