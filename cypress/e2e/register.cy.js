function testRegistration ({ cardNumber, expirationDate, disablePayment, registrationPath, shirtSize, period }) {
  // cy.viewport('macbook-15')
  cy.viewport('iphone-x')
  registrationPath = registrationPath || '/register'
  let testUrl = 'http://localhost:3000/leagues/fall-league-2026' + registrationPath
  testUrl = new URL(testUrl)
  if (disablePayment) {
    testUrl.searchParams.set('disable_payment', 'true')
  }
  testUrl.searchParams.set('force_form', 'true')
  // `force_period` pins the registration window (early/regular/late) so the test doesn't
  // depend on the league's real DB dates or the current date. Defaults to 'regular' so the
  // late-fee checkbox/messaging never shows unless a test explicitly asks for 'late'.
  const registrationPeriod = period || 'regular'
  testUrl.searchParams.set('force_period', registrationPeriod)
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
  if (!isSubstitution) {
    cy.get('#participation').select('50')

    cy.get('body').then(($body) => {
      if ($body.find('#shirtSize').length) {
        cy.get('#shirtSize').select(shirtSize || 'NA')
      }
    })

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
  cy.get('#registrationLevel').select('Student')
  if (!disablePayment && !isSubstitution) {
    cy.get('#donationLevel').select('tier_0')
  }

  if (!disablePayment) {
    cy.get('#streetAddress').type('123 Test Way')
    cy.iframe('#braintree-hosted-field-number')
      .find('#credit-card-number')
      .type(cardNumber || '4111 1111 1111 1111')

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
}

describe('Registration: Regular', () => {
  it('Should allow registration with a jersey', () => {
    testRegistration({
      shirtSize: 'M'
    })
  })

  it('Should allow registration without a jersey', () => {
    testRegistration({
      shirtSize: 'NA'
    })
  })

  it('Should show processor declined', () => {
    // https://developer.paypal.com/braintree/docs/reference/general/testing/node
    testRegistration({
      cardNumber: '4000111111111511'
    })
  })

  it('Should allow comped registration', () => {
    testRegistration({
      disablePayment: true
    })
  })

  it('Should allow late registration with the late fee acknowledgement', () => {
    testRegistration({
      shirtSize: 'M',
      period: 'late'
    })
  })
})

describe('Registration: Substitution', () => {
  it('Should accept a substitution', () => {
    // https://developer.paypal.com/braintree/docs/reference/general/testing/node
    testRegistration({
      registrationPath: '/substitutions'
    })
  })

})
