const getIframeDocument = (selector) => {
  return cy
    .get(selector)
    .its('0.contentDocument').should('exist')
}

const getIframeBody = (selector) => {
  return getIframeDocument(selector)
    .its('body').should('not.be.undefined')
    .then(cy.wrap)
}

function shouldHandlePaymentWithNumber ({ cardNumber, expirationDate }) {
  cy.viewport('iphone-x')
  cy.visit('http://localhost:5000/register')
  cy.get('#firstName').type('Test')
  cy.get('#lastName').type('Robot')
  cy.get('#email').type('testrobot@robot.com')
  cy.get('#gender').select('Male')
  cy.get('#skillLevel').select('4')
  cy.get('#partnerName').type('Test Friend')
  cy.get('#comments').type('A random comment about me when registering for the draft')
  cy.get('#usauNumber').type('12345')
  cy.get('#wouldCaptain').select('No')
  cy.get('#termsConditions').check()
  cy.get('#covid19NoRisk').check()

  cy.get('#age').type('25')
  cy.get('#registrationLevel').select('Student')

  // const lateFeeCheckbox = cy.get('#understandsLateFee')
  // if (lateFeeCheckbox) {
  //   lateFeeCheckbox.check()
  // }

  cy.get('#streetAddress').type('123 Test Way')
  getIframeBody('#braintree-dropin-frame').find('#credit-card-number').type(cardNumber || '4111 1111 1111 1111')
  getIframeBody('#braintree-dropin-frame').find('#expiration').type(expirationDate || '02 25')
  getIframeBody('#braintree-dropin-frame').find('#cvv').type('123')
  getIframeBody('#braintree-dropin-frame').find('#postal-code').type('12345')
  cy.get('#submitButton').click()
}

describe('Registration', () => {
  it('Should allow regular registration', () => {
    shouldHandlePaymentWithNumber({})
  })

  // it('Should handle failed transaction', () => {
  //   // https://developer.paypal.com/braintree/docs/reference/general/testing/node
  //   shouldHandlePaymentWithNumber({
  //     // expirationDate: '01 22'
  //   })
  // })
})
