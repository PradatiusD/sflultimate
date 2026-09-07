import { testRegistration } from '../support/registration'

const processorDeclinedMessage = 'Your transaction was declined by your bank. Please double-check your card details, contact your card issuer, or try another payment method.  Your card was not charged.'

describe('Registration payment: Processor decline', () => {
  it('Should tell the user how to resolve a processor-declined payment', () => {
    testRegistration({
      expectedPaymentError: processorDeclinedMessage,
      forcePaymentFailure: 'processor_declined'
    })
  })
})
