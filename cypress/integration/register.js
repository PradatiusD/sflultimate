const getIframeDocument = (selector) => {
  return cy
    .get(selector)
    // Cypress yields jQuery element, which has the real
    // DOM element under property "0".
    // From the real DOM iframe element we can get
    // the "document" element, it is stored in "contentDocument" property
    // Cypress "its" command can access deep properties using dot notation
    // https://on.cypress.io/its
    .its('0.contentDocument').should('exist')
}

const getIframeBody = (selector) => {
  // get the document
  return getIframeDocument(selector)
    // automatically retries until body is loaded
    .its('body').should('not.be.undefined')
    // wraps "body" DOM element to allow
    // chaining more Cypress commands, like ".find(...)"
    .then(cy.wrap)
}

describe('Registration', () => {
  it('Should allow registration', () => {
    cy.viewport('iphone-x')
    cy.visit('http://localhost:5000/register?preview=true')
    cy.get('#firstName').type('Test')
    cy.get('#lastName').type('Robot')
    cy.get('#email').type('testrobot@robot.com')
    cy.get('#gender').select('Male')
    cy.get('#skillLevel').select('4')
    cy.get('#partnerName').type('Test Friend')
    cy.get('#comments').type('A random comment')
    cy.get('#wouldCaptain').select('No')
    cy.get('#termsConditions').check()
    cy.get('#covid19NoRisk').check()

    cy.get('#age').type('25')
    cy.get('#registrationLevel').select('Student')

    const lateFeeCheckbox = cy.get('#understandsLateFee')
    if (lateFeeCheckbox) {
      lateFeeCheckbox.check()
    }

    cy.get('#streetAddress').type('123 Test Way')
    getIframeBody('#braintree-dropin-frame').find('#credit-card-number').type('4111 1111 1111 1111')
    getIframeBody('#braintree-dropin-frame').find('#expiration').type('02 25')
    getIframeBody('#braintree-dropin-frame').find('#cvv').type('123')
    getIframeBody('#braintree-dropin-frame').find('#postal-code').type('12345')
    cy.get('#submitButton').click()
  })
})
