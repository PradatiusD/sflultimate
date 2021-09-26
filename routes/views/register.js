const keystone = require('keystone')
const PlayerModel = keystone.list('Player').model
const League = keystone.list('League')
const PaymentUtils = require('../utils')
const uuid = require('uuid')

module.exports = async function (req, res) {
  const view = new keystone.View(req, res)
  const locals = res.locals
  locals.league = await League.model.findOne({ isActive: true }).lean().exec()
  PaymentUtils.setBaseRegistrationLocals(view, res)

  view.on('get', async function (next) {
    if (req.query.preview === 'true') {
      return next()
    }
    res.sendStatus(404)
  })

  view.on('post', async function (next) {
    const {
      comments,
      email,
      firstName,
      gender,
      lastName,
      participation,
      partnerName,
      registrationLevel,
      recaptchaToken,
      skillLevel,
      shirtSize,
      streetAddress
    } = req.body

    const paymentMethodNonce = req.body.payment_method_nonce

    try {
      const recaptchaResponse = await PaymentUtils.validateRecaptchaToken(recaptchaToken)
      if (recaptchaResponse && recaptchaResponse.score <= 0.9) {
        locals.err = 'Unauthorized transaction'
        return next()
      }
    } catch (err) {
      locals.err = JSON.stringify(err)
      return next()
    }

    const amount = registrationLevel === 'Student' ? 30 : 50

    const purchase = {
      amount: amount,
      paymentMethodNonce,
      options: {
        submitForSettlement: true
      },
      customer: {
        firstName,
        lastName,
        email
      },
      billing: {
        streetAddress
      },
      customFields: {
        partner: partnerName,
        gender: gender,
        skillLevel,
        participation
      }
    }

    try {
      const result = await PaymentUtils.createSale(purchase)
      if (!result.success) {
        console.log(JSON.stringify(result, null, 2))
        locals.err = JSON.stringify(result, null, 2)
        return next()
      }

      const player = new PlayerModel({
        name: {
          first: firstName,
          last: lastName
        },
        email,
        partners: partnerName,
        password: uuid.v4(),
        gender,
        skillLevel,
        comments,
        shirtSize,
        participation,
        registrationLevel
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
