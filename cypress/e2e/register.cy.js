import { testRegistration, visitRegistrationForm } from '../support/registration'

describe('Registration: Regular', () => {
  it('Should default first-time players to student pricing with an included jersey', () => {
    visitRegistrationForm()

    cy.get('#registrationLevel option[value="Student"]').invoke('text').then((studentLabel) => {
      cy.get('#registrationLevel option[value="First Time Player"]')
        .should('contain.text', studentLabel.replace('Student', '').trim())
    })
    cy.get('#isFirstTimePlayer').select('Yes')
    cy.get('#registrationLevel').should('have.value', 'First Time Player')
    cy.get('#shirtSize option[value="NA"]').should('not.exist')
  })

  it('Should show separate adult prices and only ask for a size with a jersey', () => {
    visitRegistrationForm()

    cy.get('#registrationLevel option[value="Adult without jersey"]')
      .should('contain.text', 'without jersey')
    cy.get('#registrationLevel option[value="Adult with jersey"]')
      .should('contain.text', 'with jersey')

    cy.get('#registrationLevel').select('Adult without jersey')
    cy.get('#shirtSize').should('not.exist')

    cy.get('#registrationLevel').select('Adult with jersey')
    cy.get('#shirtSize').should('be.visible')
    cy.get('#shirtSize option[value="NA"]').should('not.exist')
  })

  it('Should allow comped registration', () => {
    testRegistration({
      disablePayment: true
    })
  })
})
