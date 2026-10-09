import { testRegistration } from '../support/registration'

const gatewayRejectionMessage = 'Your payment was rejected. Please verify that your street address and ZIP code are correct, or try another payment method.'

describe('Registration payment: Gateway rejection', () => {
  it('Should tell the user how to resolve a gateway-rejected payment', () => {
    testRegistration({
      expectedPaymentError: gatewayRejectionMessage,
      forcePaymentFailure: 'gateway_rejected'
    })
  })
})
