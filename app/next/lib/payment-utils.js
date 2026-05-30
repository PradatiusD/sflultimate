const braintree = require('braintree')
const request = require('request')

const {
  BRAINTREE_ENV,
  BRAINTREE_MERCHANT_ID,
  BRAINTREE_PUBLIC_KEY,
  BRAINTREE_PRIVATE_KEY,
  RECAPTCHA_SECRET_KEY
} = process.env

const braintreeAccount = {
  environment: braintree.Environment[BRAINTREE_ENV],
  merchantId: BRAINTREE_MERCHANT_ID,
  publicKey: BRAINTREE_PUBLIC_KEY,
  privateKey: BRAINTREE_PRIVATE_KEY
}

function getGateway () {
  if (!BRAINTREE_ENV || !BRAINTREE_MERCHANT_ID || !BRAINTREE_PUBLIC_KEY || !BRAINTREE_PRIVATE_KEY) {
    return null
  }

  return braintree.connect(braintreeAccount)
}

class PaymentUtils {
  /**
   * Get Braintree Client Token
   * @return {Promise<string>}
   */
  generateGatewayClientToken () {
    const gateway = getGateway()

    if (!gateway) {
      return Promise.resolve(null)
    }

    return new Promise((resolve, reject) => {
      gateway.clientToken.generate({}, function (err, response) {
        if (err || !response.clientToken) {
          return reject(err)
        }
        resolve(response.clientToken)
      })
    })
  }

  createSale (purchaseOptions) {
    const gateway = getGateway()

    if (!gateway) {
      return Promise.reject(new Error('Missing Braintree configuration'))
    }

    return new Promise((resolve, reject) => {
      gateway.transaction.sale(purchaseOptions, (err, result) => {
        if (err) {
          return reject(err)
        }
        resolve(result)
      })
    })
  }

  validateRecaptchaToken (token, options = {}) {
    const secretKey = options.secretKey || RECAPTCHA_SECRET_KEY
    // eslint-disable-next-line camelcase
    const captchaURL = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`
    const params = {
      url: captchaURL,
      method: 'POST',
      json: true
    }

    return new Promise((resolve, reject) => {
      request(params, (err, response, data) => {
        if (err) {
          return reject(err)
        }
        resolve(data)
      })
    })
  }
}

const paymentUtils = new PaymentUtils()

module.exports = paymentUtils
module.exports.default = paymentUtils
module.exports.generateGatewayClientToken = paymentUtils.generateGatewayClientToken.bind(paymentUtils)
module.exports.createSale = paymentUtils.createSale.bind(paymentUtils)
module.exports.validateRecaptchaToken = paymentUtils.validateRecaptchaToken.bind(paymentUtils)
