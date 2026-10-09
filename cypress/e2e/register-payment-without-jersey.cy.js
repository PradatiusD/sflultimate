import { testRegistration } from '../support/registration'

describe('Registration payment: Adult without jersey', () => {
  it('Should allow registration without a jersey', () => {
    testRegistration({
      registrationLevel: 'Adult without jersey',
      shirtSize: 'NA'
    })
  })
})
