import { visitRegistrationForm } from '../support/registration'

describe('Registration street address validation (mocked payment boundary)', () => {
  beforeEach(() => {
    // Block both endpoints even when a test expects no submission.
    cy.intercept('POST', '/api/register', { statusCode: 200, body: 'Test registration received' }).as('register')
    cy.intercept('POST', '/api/substitutions', { statusCode: 200, body: 'Test substitution received' }).as('substitutions')
    cy.intercept('GET', 'https://js.braintreegateway.com/web/dropin/1.44.1/js/dropin.min.js', {
      fixture: 'registration-dropin.txt', headers: { 'content-type': 'application/javascript' }
    })
    cy.intercept('GET', 'https://www.google.com/recaptcha/api.js*', {
      body: '', headers: { 'content-type': 'application/javascript' }
    })
    cy.on('window:before:load', win => {
      win.grecaptcha = {
        ready: callback => callback(),
        execute: () => Promise.resolve('test-captcha')
      }
    })
  })

  function fillRequiredFields (isSubstitution) {
    cy.get('#firstName').type('Test')
    cy.get('#lastName').type('Player')
    cy.get('#email').type('player@example.test')
    cy.get('#phoneNumber').type('9545550100')
    cy.get('#age').type('25')
    if (!isSubstitution) cy.get('#isFirstTimePlayer').select('No')
    cy.get('#gender').select('Female')
    cy.get('#athleticismLevel').select('2')
    cy.get('#experienceLevel').select('2')
    cy.get('#throwsLevel').select('2')
    cy.get('#registrationLevel').select('Student')
    if (!isSubstitution) cy.get('#wouldCaptain').select('No')
    // Attendance and jersey fields depend on the local league's configuration.
    cy.get('#registration select[required]').each($select => {
      if (!$select.val()) cy.wrap($select).select($select.find('option[value!=""]').first().val())
    })
    cy.get('#registration input[type="checkbox"][required]').check()
    cy.get('#playerPositionHandler').check()
  }

  ;['/register', '/substitutions'].forEach(registrationPath => {
    const alias = registrationPath.slice(1)

    it(`blocks blank and whitespace addresses before payment on ${registrationPath}`, () => {
      const { isSubstitution } = visitRegistrationForm({ registrationPath })
      cy.contains('Test payment method ready').should('be.visible')
      cy.window().then(win => cy.spy(win.braintree.dropin, 'requestPaymentMethod').as('requestPaymentMethod'))
      fillRequiredFields(isSubstitution)

      // Prove the address is the only invalid field, not another missing answer.
      cy.get('#registration :invalid').should('have.length', 1).and('have.attr', 'id', 'streetAddress')
      cy.get('#streetAddress').should('have.prop', 'required', true)
      cy.get('#submitButton').click()
      cy.get('#streetAddress').should('be.focused').then($input => {
        expect($input[0].validity.valueMissing).to.equal(true)
      })
      cy.get('@requestPaymentMethod').should('not.have.been.called')
      cy.get(`@${alias}.all`).should('have.length', 0)

      cy.get('#streetAddress').type('   ')
      cy.get('#submitButton').click()
      cy.get('#streetAddress').should('have.value', '').and('be.focused')
      cy.get('@requestPaymentMethod').should('not.have.been.called')
      cy.get(`@${alias}.all`).should('have.length', 0)

      cy.get('#streetAddress').type('123 Test Way')
      cy.get('#registration').then($form => expect($form[0].checkValidity()).to.equal(true))
      cy.get('#submitButton').click()
      cy.wait(`@${alias}`).then(({ request }) => {
        expect(new URLSearchParams(request.body).get('streetAddress')).to.equal('123 Test Way')
      })
      cy.get('@requestPaymentMethod').should('have.been.calledOnce')
    })

    it(`does not require an address for comped ${registrationPath}`, () => {
      const { isSubstitution } = visitRegistrationForm({ registrationPath, disablePayment: true })
      fillRequiredFields(isSubstitution)
      cy.get('#streetAddress').should('not.exist')
      cy.get('#registration').then($form => expect($form[0].checkValidity()).to.equal(true))
      cy.get('#submitButton').click()
      cy.wait(`@${alias}`).then(({ request }) => {
        expect(new URLSearchParams(request.body).has('streetAddress')).to.equal(false)
      })
    })
  })
})
