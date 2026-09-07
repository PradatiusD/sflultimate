import { testRegistration } from '../support/registration'

describe('Registration payment: Late registration', () => {
  it('Should allow late registration with the late fee acknowledgement', () => {
    testRegistration({
      shirtSize: 'M',
      period: 'late'
    })
  })
})
