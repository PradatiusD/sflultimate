const keystone = require('keystone')
const PlayerModel = keystone.list('Player').model
const PaymentUtils = require('../utils')
const uuid = require('uuid')
const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
})

module.exports = async function (req, res) {
  const view = new keystone.View(req, res)
  const locals = res.locals

  /**
   * Format Date
   * @param {Date} date
   * @return {string}
   */
  locals.formatDate = function (date) {
    if (!date) {
      return ''
    }
    return date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', timeZone: 'America/New_York' })
  }

  /**
   * Format Time
   * @param {Date} date
   * @return {string}
   */
  locals.formatTime = function (date) {
    if (!date) {
      return ''
    }
    return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', timeZone: 'America/New_York' })
  }

  PaymentUtils.setBaseRegistrationLocals(view, res)

  view.on('post', async function (next) {
    // Cast to boolean
    req.body.wouldCaptain = req.body.wouldCaptain === 'Yes'
    req.body.willAttendFinals = req.body.willAttendFinals === 'on'
    req.body.termsConditions = req.body.termsConditions === 'on'

    const {
      comments,
      email,
      firstName,
      gender,
      lastName,
      participation,
      age,
      ageGroup,
      phoneNumber,
      usauNumber,
      wouldCaptain,
      partnerName,
      registrationLevel,
      recaptchaToken,
      skillLevel,
      shirtSize,
      streetAddress,
      wouldSponsor,
      donationLevel,
      willAttendFinals,
      preferredPositions
    } = req.body

    const paymentMethodNonce = req.body.payment_method_nonce

    try {
      const recaptchaResponse = await PaymentUtils.validateRecaptchaToken(recaptchaToken)
      if (recaptchaResponse && recaptchaResponse.score <= 0.5) {
        locals.err = 'Unauthorized transaction, we believe you are a bot.  Please contact sflultimate@gmail.com.'
        return next()
      }
    } catch (err) {
      locals.err = JSON.stringify(err)
      return next()
    }

    let amount

    if (locals.league.isEarlyRegistrationPeriod) {
      amount = registrationLevel === 'Student' ? locals.fees.earlyStudent : locals.fees.earlyAdult
    } else if (locals.league.isRegistrationPeriod) {
      amount = registrationLevel === 'Student' ? locals.fees.regularStudent : locals.fees.regularAdult
    } else if (locals.league.isLateRegistrationPeriod) {
      amount = registrationLevel === 'Student' ? locals.fees.lateStudent : locals.fees.lateAdult
    }

    const donationTiers = {
      tier_0: 0,
      tier_1: 5,
      tier_2: 10,
      tier_3: 25
    }

    const donationAmount = donationTiers[donationLevel]
    amount += (donationAmount || 0)

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
        participation,
        donationAmount
      }
    }

    try {
      const result = await PaymentUtils.createSale(purchase)
      if (!result.success) {
        console.log(JSON.stringify(result, null, 2))
        if (result.message) {
          locals.err = 'We\'re sorry, the payment processor rejected this transaction for the following reason: ' + result.message
        } else {
          locals.err = JSON.stringify(result, null, 2)
        }
        return next()
      }
      const newPlayerRecord = {
        createdAt: new Date(),
        updatedAt: new Date(),
        age,
        name: {
          first: firstName,
          last: lastName
        },
        email,
        partners: partnerName,
        password: uuid.v4(),
        leagues: [
          locals.league._id
        ],
        gender,
        skillLevel,
        comments,
        shirtSize,
        participation,
        partnerName,
        wouldCaptain,
        registrationLevel,
        usauNumber,
        phoneNumber,
        wouldSponsor,
        donationAmount,
        willAttendFinals
      }

      if (Array.isArray(preferredPositions)) {
        newPlayerRecord.preferredPositions = preferredPositions
      } else if (typeof preferredPositions === 'string') {
        newPlayerRecord.preferredPositions = [preferredPositions]
      } else {
        newPlayerRecord.preferredPositions = []
      }

      console.log(newPlayerRecord)

      const player = new PlayerModel(newPlayerRecord)

      await player.save()

      try {
        const emailSendParams = {
          from: 'South Florida Ultimate" <sflultimate@gmail.com>',
          to: email,
          subject: 'Registration Confirmation for ' + locals.league.title,
          html: `
            <p>Hi ${firstName}, thank you for your payment!</p>
            <p>Below you can find a receipt for your ${locals.league.title} registration.</p>
            <table style="border: 1px solid #dadada; padding: 4px;">
              <thead>
                <tr>
                  <th>Field</th>
                  <th>Your Submission</th> 
                </tr>
              </thead>
              <tbody>
                <tr><td>First Name</td><td>${firstName}</td></tr>
                <tr><td>Last Name</td><td>${lastName}</td></tr>
                <tr><td>Registration Level</td><td>${registrationLevel}</td></tr>
                <tr><td>Amount Paid</td><td>$${amount}</td></tr>
                <tr><td>Amount Donated</td><td>$${donationAmount}</td></tr>
                <tr><td>Gender</td><td>${gender}</td></tr>
                <tr><td>Participation</td><td>${participation}</td></tr>
                <tr><td>Comments</td><td>${comments}</td></tr>
                <tr><td>Email</td><td>${email}</td></tr>
                <tr><td>Phone Number</td><td>${phoneNumber}</td></tr>
                <tr><td>Age</td><td>${age}</td></tr>
                <tr><td>Wanted to Captain</td><td>${wouldCaptain ? 'Yes' : 'No'}</td></tr>
                <tr><td>Partner's Name</td><td>${partnerName}</td></tr>
                <tr><td>Self-described skill level</td><td>${skillLevel}</td></tr>
                <tr><td>Shirt Size</td><td>${shirtSize}</td></tr>          
              </tbody>
            </table>
            <p><em>Organized by South Florida Ultimate Inc., a local non-for-profit and social recreational club organized for the exclusive purposes of <strong>playing</strong>, <strong>promoting</strong>, and <strong>enjoying</strong> the sport known as Ultimate or Ultimate Frisbee.</em></p>
          `
        }

        await transporter.sendMail(emailSendParams)
      } catch (e) {
        console.error('Cound not send email for ' + email)
        console.error(e)
      }

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
