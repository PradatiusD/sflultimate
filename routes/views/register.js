const keystone = require('keystone')
const Player = keystone.list('Player')
const League = keystone.list('League')
const _ = require('underscore')
const PaymentUtils = require('../utils')

module.exports = function (req, res) {
  const view = new keystone.View(req, res)
  const locals = res.locals
  PaymentUtils.setBaseRegistrationLocals(view, res)

  view.on('get', async function (next) {
    if (req.query.preview === 'true') {
      locals.league = await League.model.findOne({ isActive: true }).lean().exec()
      return next()
    }
    res.sendStatus(404)
  })

  view.on('post', async function (next) {
    const {
      // eslint-disable-next-line camelcase
      registration_dates, payment_method_nonce, first_name, last_name, partner_name, recaptcha_token,
      email,
      gender,
      skillLevel,
      comments
    } = req.body

    try {
      const recaptchaResponse = await PaymentUtils.validateRecaptchaToken(recaptcha_token)
      if (recaptchaResponse && recaptchaResponse.score <= 0.7) {
        locals.err = 'Unauthorized transaction'
        return next()
      }
    } catch (err) {
      locals.err = JSON.stringify(err)
      return next()
    }

    // eslint-disable-next-line camelcase
    if (!registration_dates) {
      locals.err = 'Please pick at least one registration date'
      return next()
    }

    const amount = 10

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

    try {
      const result = await PaymentUtils.createSale(purchase)
      if (!result.success) {
        console.log(JSON.stringify(result, null, 2))
        locals.err = JSON.stringify(result)
        return next()
      }

      // eslint-disable-next-line new-cap
      const player = new Player.model({
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

      await player.save()
      res.redirect('/confirmation')
    } catch (err) {
      locals.err = err
      console.log(err)
      return next()
    }
  })

  // Render the view
  view.render('register')
}
