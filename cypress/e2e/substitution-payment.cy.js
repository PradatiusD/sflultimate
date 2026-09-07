import { testRegistration } from '../support/registration'

describe('Substitution payment', () => {
  it('Should accept a substitution', () => {
    testRegistration({
      registrationPath: '/substitutions'
    })
  })
})
