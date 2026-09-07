import { testRegistration } from '../support/registration'

describe('Registration payment: Adult with jersey', () => {
  it('Should allow registration with a jersey', () => {
    testRegistration({
      registrationLevel: 'Adult with jersey',
      shirtSize: 'M'
    })
  })
})
