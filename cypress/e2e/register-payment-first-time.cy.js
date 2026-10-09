import { testRegistration } from '../support/registration'

describe('Registration payment: First-time player', () => {
  it('Should confirm a first-time player registration with an included jersey', () => {
    testRegistration({
      registrationLevel: 'First Time Player',
      shirtSize: 'M'
    })
  })
})
