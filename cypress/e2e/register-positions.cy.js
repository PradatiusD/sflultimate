import { visitRegistrationForm } from '../support/registration'

describe('Preferred position reminder', () => {
  beforeEach(() => {
    cy.intercept('POST', '/api/register', { statusCode: 200, body: 'No registration submitted' })
    cy.intercept('POST', '/api/substitutions', { statusCode: 200, body: 'No substitution submitted' })
    cy.intercept('GET', 'https://js.braintreegateway.com/web/dropin/1.44.1/js/dropin.min.js', { body: '' })
    cy.intercept('GET', 'https://www.google.com/recaptcha/api.js*', { body: '' })
    cy.on('window:before:load', win => {
      win.grecaptcha = {
        ready: callback => callback(),
        execute: () => Promise.resolve('test-captcha')
      }
    })
  })

  ;['/register', '/substitutions'].forEach(registrationPath => {
    it(`shows the reminder only when no positions are selected on ${registrationPath}`, () => {
      visitRegistrationForm({ registrationPath, disablePayment: true })
      cy.get('#playerPositionError').should('be.visible')
      ;['Handler', 'Cutter', 'Hybrid', 'Defense'].forEach(position => {
        cy.get(`#playerPosition${position}`).check()
        cy.get('#playerPositionError').should('not.exist')
        cy.get(`#playerPosition${position}`).uncheck()
        cy.get('#playerPositionError').should('be.visible')
      })
      cy.get('#playerPositionHandler').check()
      cy.get('#playerPositionCutter').check()
      cy.get('#playerPositionHandler').uncheck()
      cy.get('#playerPositionError').should('not.exist')
      cy.get('#playerPositionCutter').uncheck()
      cy.get('#playerPositionError').should('be.visible')
    })

    it(`hides the reminder for restored positions on ${registrationPath}`, () => {
      visitRegistrationForm({ registrationPath, disablePayment: true })
      cy.window().then(win => {
        win.sessionStorage.setItem('sfl-registration-form', JSON.stringify({
          path: win.location.pathname,
          fields: [['preferredPositions', 'handler'], ['preferredPositions', 'cutter']]
        }))
        const url = new URL(win.location.href)
        url.searchParams.set('error', 'Test registration error')
        cy.visit(url.toString())
      })
      cy.get('#playerPositionHandler').should('be.checked')
      cy.get('#playerPositionCutter').should('be.checked')
      cy.get('#playerPositionError').should('not.exist')
      cy.get('#playerPositionHandler').uncheck()
      cy.get('#playerPositionError').should('not.exist')
      cy.get('#playerPositionCutter').uncheck()
      cy.get('#playerPositionError').should('be.visible')
    })
  })
})
