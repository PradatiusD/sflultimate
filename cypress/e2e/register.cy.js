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

async function shouldHandlePaymentWithNumber ({ cardNumber, expirationDate }) {
  cy.viewport('iphone-x')
  const testUrl = 'http://localhost:5000/register?force_form=true'
  cy.visit(testUrl)
  cy.get('#firstName').type('Test')
  cy.get('#lastName').type('Robot')
  const testEmailAddress = 'danielprada2012+sflultimate-test-' + Math.floor(Math.random() * 10000).toString() + '@gmail.com'
  cy.get('#email').type(testEmailAddress)
  cy.get('#gender').select('Male')
  cy.get('#skillLevel').select('4')
  cy.get('#partnerName').type('Test Friend')
  cy.get('#willAttendFinals').check()
  const $body = await cy.get('body')
  const $noUnderstandsLateFeeElement = $body.find('#no-understandsLateFee')
  if (!$noUnderstandsLateFeeElement.length) {
    cy.get('#understandsLateFee').check()
  }
  cy.get('#comments').type('A random comment about me when registering for the draft')
  cy.get('#phoneNumber').type('9543055611')
  cy.get('#wouldCaptain').select('No')
  cy.get('#termsConditions').check()

  const $noSponsorElement = await $body.find('#no-requestSponsorship')
  if (!$noSponsorElement.length) {
    cy.get('#wouldSponsor').check()
  }

  cy.get('#playerPositionHandler').check()
  cy.get('#playerPositionCutter').check()
  cy.get('#playerPositionHybrid').check()
  cy.get('#playerPositionDefense').check()

  cy.get('#codeOfConduct1').check()
  cy.get('#codeOfConduct2').check()
  cy.get('#codeOfConduct3').check()
  cy.get('#codeOfConduct4').check()

  cy.get('#age').type('25')
  cy.get('#registrationLevel').select('Student')
  cy.get('#donationLevel').select('tier_2')

  const $lateFeeCheckbox = await $body.find('#understandsLateFee')
  if ($lateFeeCheckbox.length) {
    cy.get('#understandsLateFee').check()
  }

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
