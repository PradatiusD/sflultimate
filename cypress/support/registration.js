export function visitRegistrationForm ({ disablePayment, forcePaymentFailure, registrationPath, period } = {}) {
  cy.viewport('iphone-x')
  registrationPath = registrationPath || '/register'
  let testUrl = 'http://localhost:3000/leagues/fall-league-2026' + registrationPath
  testUrl = new URL(testUrl)
  if (disablePayment) {
    testUrl.searchParams.set('disable_payment', 'true')
  }
  if (forcePaymentFailure) {
    testUrl.searchParams.set('force_payment_failure', forcePaymentFailure)
  }
  testUrl.searchParams.set('force_form', 'true')
  // Pin the registration window so tests do not depend on DB dates or the current date.
  const registrationPeriod = period || 'regular'
  testUrl.searchParams.set('force_period', registrationPeriod)
  const isSubstitution = registrationPath === '/substitutions'
  cy.visit(testUrl.toString())

  return { isSubstitution, registrationPeriod }
}

export function testRegistration ({ disablePayment, expirationDate, expectedPaymentError, forcePaymentFailure, registrationLevel, registrationPath, shirtSize, period } = {}) {
  const { isSubstitution, registrationPeriod } = visitRegistrationForm({ disablePayment, forcePaymentFailure, registrationPath, period })
  cy.get('#firstName').type('Test')
  cy.get('#lastName').type('Robot')
  const testEmailAddress = 'danielprada2012+sflultimate-test-' + Math.floor(Math.random() * 10000).toString() + '@gmail.com'
  cy.get('#email').type(testEmailAddress)
  cy.get('#gender').select('Male')
  cy.get('#athleticismLevel').select('2')
  cy.get('#experienceLevel').select('4')
  cy.get('#throwsLevel').select('3')
  if (!isSubstitution) {
    cy.get('#participation').select('50')
    cy.get('#isFirstTimePlayer').select('Yes')
    cy.get('#partnerName').type('Test Friend')
    cy.get('#willAttendFinals').check()
  }

  if (registrationPeriod === 'late') {
    cy.get('#understandsLateFee').should('be.visible').check()
  } else {
    cy.get('#understandsLateFee').should('not.exist')
  }
  cy.get('#comments').type('A random comment about me when registering for the draft')
  cy.get('#phoneNumber').type('9543055611')
  if (!isSubstitution) {
    cy.get('#wouldCaptain').select('Yes')
  }
  cy.get('#termsConditions').check()

  cy.get('body').then(($body) => {
    if ($body.find('#wouldSponsor').length) {
      cy.get('#wouldSponsor').check()
    }
  })

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
  registrationLevel = registrationLevel || 'Student'
  cy.get('#registrationLevel').select(registrationLevel)
  if (!isSubstitution && registrationLevel !== 'Adult without jersey') {
    cy.get('#shirtSize').should('be.visible').select(shirtSize || 'M')
  }
  if (!isSubstitution && registrationLevel === 'Adult without jersey') {
    cy.get('#shirtSize').should('not.exist')
  }
  if (!disablePayment && !isSubstitution) {
    cy.get('#donationLevel').select('tier_0')
  }

  if (!disablePayment) {
    cy.get('#streetAddress').type('123 Test Way')
    cy.iframe('#braintree-hosted-field-number')
      .find('#credit-card-number')
      .type('4111 1111 1111 1111')

    cy.iframe('#braintree-hosted-field-expirationDate')
      .find('#expiration').type(expirationDate || '02 28')

    cy.iframe('#braintree-hosted-field-cvv')
      .find('#cvv')
      .type('123')

    cy.iframe('#braintree-hosted-field-postalCode')
      .find('#postal-code')
      .type('12345')
  }

  cy.get('#submitButton').click()

  if (!expectedPaymentError) {
    cy.location('pathname', { timeout: 30000 }).should('eq', '/confirmation')
    if (!isSubstitution) {
      cy.contains('Registration type:').should('contain.text', registrationLevel.startsWith('Adult ') ? 'Adult' : registrationLevel)
      if (shirtSize === 'NA') {
        cy.contains('Jersey:').should('not.exist')
      } else {
        cy.contains('Jersey:').should('contain.text', `size ${shirtSize || 'M'}`)
      }
    }
  } else {
    cy.location('search', { timeout: 30000 }).should('include', 'error=')
    cy.location('pathname').should('eq', '/leagues/fall-league-2026/register')
    cy.get('.alert-danger').should('contain.text', expectedPaymentError)
    cy.get('#firstName').should('have.value', 'Test')
    cy.get('#lastName').should('have.value', 'Robot')
    cy.get('#email').should('have.value', testEmailAddress)
    cy.get('#gender').should('have.value', 'Male')
    cy.get('#comments').should('have.value', 'A random comment about me when registering for the draft')
    cy.get('#playerPositionHandler').should('be.checked')
    cy.get('#codeOfConduct1').should('be.checked')
    cy.get('#termsConditions').should('be.checked')
    cy.get('#registrationLevel').should('have.value', registrationLevel)
    cy.get('#streetAddress').should('have.value', '')
  }
}
