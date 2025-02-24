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

const gateway = braintree.connect(braintreeAccount)

class PaymentUtils {
  /**
   * Get Braintree Client Token
   * @return {Promise<string>}
   */
  generateGatewayClientToken () {
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
    return new Promise((resolve, reject) => {
      gateway.transaction.sale(purchaseOptions, (err, result) => {
        if (err) {
          return reject(err)
        }
        resolve(result)
      })
    })
  }

  validateRecaptchaToken (token) {
    // eslint-disable-next-line camelcase
    const captchaURL = `https://www.google.com/recaptcha/api/siteverify?secret=${RECAPTCHA_SECRET_KEY}&response=${token}`
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

  addLeagueStatus (league) {
    league.isEarlyRegistrationPeriod = PaymentUtils.isValidRegPeriod(league.earlyRegistrationStart, league.earlyRegistrationEnd)
    league.isRegistrationPeriod = PaymentUtils.isValidRegPeriod(league.registrationStart, league.registrationEnd)
    league.isLateRegistrationPeriod = PaymentUtils.isValidRegPeriod(league.lateRegistrationStart, league.lateRegistrationEnd) // || (req.query.force_form === 'true'
    league.canRegister = league.isEarlyRegistrationPeriod || league.isRegistrationPeriod || league.isLateRegistrationPeriod
  }

  /**
   *
   * @param {Date} regStart
   * @param {Date} regEnd
   * @return {boolean}
   */
  static isValidRegPeriod (regStart, regEnd) {
    const now = Date.now()
    if (regStart && regEnd) {
      regStart = new Date(regStart)
      regEnd = new Date(regEnd)
    }
    return !!(regStart && regEnd && regStart.getTime() < now && now < regEnd.getTime())
  }
}

module.exports = new PaymentUtils()
