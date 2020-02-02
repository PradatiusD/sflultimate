const keystone = require('keystone')
const braintree = require('braintree')
const HatterPlayer = keystone.list('HatterPlayer')
const _ = require('underscore')
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

module.exports = function (req, res) {
  const view = new keystone.View(req, res)
  const locals = res.locals

  /*
   * Get Braintree Token
   */
  view.on('init', function (next) {
    gateway.clientToken.generate({}, function (err, response) {
      if (err || !response.clientToken) {
        locals.err = 'We are having issues connecting to our payment gateway, please wait and try again later.'
        return next()
      }
      locals.braintree_token = response.clientToken
      next()
    })
  })

  locals.section = 'register'
  locals.formData = {}

  view.on('post', function (next) {
    const {
      // eslint-disable-next-line camelcase
      registration_dates, payment_method_nonce, first_name, last_name, partner_name, recaptcha_token,
      email,
      gender,
      skillLevel,
      comments
    } = req.body

    // eslint-disable-next-line camelcase
    const captchaURL = `https://www.google.com/recaptcha/api/siteverify?secret=${RECAPTCHA_SECRET_KEY}&response=${recaptcha_token}`
    const params = {
      url: captchaURL,
      method: 'POST',
      json: true
    }

    request(params, (err, response, data) => {
      if (err) {
        locals.err = JSON.stringify(err)
        return next()
      }

      if (data && data.score <= 0.7) {
        locals.err = 'Unauthorized transaction'
        return next()
      }

      // eslint-disable-next-line camelcase
      if (!registration_dates) {
        locals.err = 'Please pick at least one registration date'
        return next()
      }

      let amount

      const datesForForm = _.isArray(registration_dates) ? registration_dates.length : registration_dates.split(',').length

      switch (datesForForm) {
        case 1:
          amount = 20
          break
        case 2:
          amount = 30
          break
      }

      const purchase = {
        amount: amount,
        paymentMethodNonce: payment_method_nonce,
        options: {
          submitForSettlement: true
        },
        customer: {
          firstName: first_name,
          lastName: last_name,
          email: email
        },
        customFields: {
          // eslint-disable-next-line camelcase
          partner: partner_name || '',
          gender: gender,
          skill_level: skillLevel,
          participation: registration_dates
        }
      }

      gateway.transaction.sale(purchase, (err, result) => {
        if (err) {
          locals.err = err
          console.log(err)
          return next()
        }

        if (!result.success) {
          console.log(JSON.stringify(locals.err, null, 2))
          locals.err = JSON.stringify(result)
          return next()
        }

        // eslint-disable-next-line new-cap
        const player = new HatterPlayer.model({
          name: {
            first: first_name,
            last: last_name
          },
          email: email,
          // eslint-disable-next-line camelcase
          partners: partner_name || '',
          gender: gender,
          skillLevel: skillLevel,
          dates_registered: registration_dates,
          comments: comments || ''
        })

        player.save((err) => {
          if (err) {
            locals.err = err
            console.log(err)
            return next()
          }

          res.redirect('/confirmation')
        })
      })
    })
  })

  // Render the view
  view.render('register')
}
