async function shouldHandlePaymentWithNumber ({ cardNumber, expirationDate, disablePayment, registrationPath }) {
  // cy.viewport('macbook-15')
  cy.viewport('iphone-x')
  let testUrl = 'http://localhost:3000/leagues/spring-league-2026' + registrationPath
  testUrl = new URL(testUrl)
  if (disablePayment) {
    testUrl.searchParams.set('disable_payment', 'true')
  }
  testUrl.searchParams.set('force_form', 'true')
  testUrl = testUrl.toString()
  const isSubstitution = registrationPath === '/substitutions'
  cy.visit(testUrl)
  cy.get('#firstName').type('Test')
  cy.get('#lastName').type('Robot')
  const testEmailAddress = 'danielprada2012+sflultimate-test-' + Math.floor(Math.random() * 10000).toString() + '@gmail.com'
  cy.get('#email').type(testEmailAddress)
  cy.get('#gender').select('Male')
  cy.get('#athleticismLevel').select('2')
  cy.get('#experienceLevel').select('4')
  cy.get('#throwsLevel').select('3')
  cy.get('#participation').select('50')
  cy.get('#shirtSize').select('NA')
  if (!isSubstitution) {
    cy.get('#partnerName').type('Test Friend')
  }
  cy.get('#willAttendFinals').check()
  const $body = await cy.get('body')
  const $noUnderstandsLateFeeElement = $body.find('#no-understandsLateFee')
  if (!$noUnderstandsLateFeeElement.length) {
    cy.get('#understandsLateFee').check()
  }
  cy.get('#comments').type('A random comment about me when registering for the draft')
  cy.get('#phoneNumber').type('9543055611')
  if (!isSubstitution) {
    cy.get('#wouldCaptain').select('Yes')
  }
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
  cy.get('#codeOfConduct5').check()

  cy.get('#age').type('25')
  cy.get('#registrationLevel').select('Student')
  if (!disablePayment && !isSubstitution) {
    cy.get('#donationLevel').select('tier_2')
  }

  const $lateFeeCheckbox = await $body.find('#understandsLateFee')
  if ($lateFeeCheckbox.length) {
    cy.get('#understandsLateFee').check()
  }

  if (!disablePayment) {
    cy.get('#streetAddress').type('123 Test Way')
    cy.iframe('#braintree-hosted-field-number')
      .find('#credit-card-number')
      .type(cardNumber || '4111 1111 1111 1111')

    cy.iframe('#braintree-hosted-field-expirationDate')
      .find('#expiration').type(expirationDate || '02 26')

    cy.iframe('#braintree-hosted-field-cvv')
      .find('#cvv')
      .type('123')

    cy.iframe('#braintree-hosted-field-postalCode')
      .find('#postal-code')
      .type('12345')
  }

  cy.get('#submitButton').click()
}

describe('Registration', () => {
  it.only('Should allow regular registration with payment', () => {
    shouldHandlePaymentWithNumber({
      registrationPath: '/register'
    })
  })

  // it('Should handle failed transaction', () => {
  //   // https://developer.paypal.com/braintree/docs/reference/general/testing/node
  //   shouldHandlePaymentWithNumber({
  //     // expirationDate: '01 22'
  //   })
  // })
  it('Should allow comped registration', () => {
    shouldHandlePaymentWithNumber({
      disablePayment: true,
      registrationPath: '/register'
    })
  })

  it('Should allow substitution registration', () => {
    shouldHandlePaymentWithNumber({
      registrationPath: '/substitutions'
    })
  })
})
