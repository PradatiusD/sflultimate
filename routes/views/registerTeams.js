const keystone = require('keystone')
const TournamentTeam = keystone.list('TournamentTeam')
const { validateRecaptchaToken, setBaseRegistrationLocals, createSale } = require('./../utils')

module.exports = function (req, res) {
  const view = new keystone.View(req, res)
  const locals = res.locals
  setBaseRegistrationLocals(view, res)

  view.on('post', async function (next) {
    // eslint-disable-next-line camelcase
    const { payment_method_nonce, recaptcha_token, first_name, last_name, email } = req.body

    try {
      const recaptchaResponse = await validateRecaptchaToken(recaptcha_token)
      if (recaptchaResponse && recaptchaResponse.score <= 0.7) {
        locals.err = 'Unauthorized transaction'
        return next()
      }
    } catch (err) {
      locals.err = JSON.stringify(err)
      return next()
    }

    const players = []
    let teammate = {}
    for (const key in req.body) {
      if (key.indexOf('teammate') > -1) {
        const prop = key.replace(/teammate_\d*_/g, '')
        const value = req.body[key]
        teammate[prop] = value
        if (teammate.first_name && teammate.last_name && teammate.email) {
          players.push(teammate)
          teammate = {}
        }
      }
    }

    const purchase = {
      amount: 150,
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
        player_names: players.map(p => `${p.first_name} ${p.last_name}`).join(', '),
        player_emails: players.map(p => p.email).join(', ')
      }
    }

    try {
      const result = await createSale(purchase)
      if (!result.success) {
        console.log(JSON.stringify(result, null, 2))
        locals.err = JSON.stringify(result)
        return next()
      }

      const modelParams = {
        organizer_name: {
          first: first_name,
          last: last_name
        },
        organizer_email: email,
        // eslint-disable-next-line camelcase
        players: players
      }

      // eslint-disable-next-line new-cap
      const tourneyTeam = new TournamentTeam.model(modelParams)

      await tourneyTeam.save()
      res.redirect('/confirmation')
    } catch (err) {
      locals.err = err
      console.log(err)
      return next()
    }
  })

  // Render the view
  view.render('register-team')
}
