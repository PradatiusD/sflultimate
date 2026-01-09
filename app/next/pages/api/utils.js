const PaymentUtils = require('./../../lib/payment-utils')
const nodemailer = require('nodemailer')

/**
 *
 * @param {object} payload
 * @param {number} amount
 * @return {Promise<unknown>}
 */
export async function processPayment (payload, amount) {
  const purchase = {
    amount,
    paymentMethodNonce: payload.paymentMethodNonce,
    options: {
      submitForSettlement: true
    },
    customer: {
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email
    },
    billing: {
      streetAddress: payload.streetAddress
    },
    customFields: {
      partner: payload.partnerName,
      gender: payload.gender,
      skillLevel: [payload.athleticismLevel, payload.experienceLevel, payload.throwsLevel].join(', '),
      participation: payload.participation
    }
  }

  const paymentResult = await PaymentUtils.createSale(purchase)

  if (!paymentResult.success) {
    console.error({ purchase, paymentResult })
    throw new Error('Payment failed')
  }

  return paymentResult
}

export function SendEmail (payload, league) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  })

  const emailSendParams = {
    from: 'South Florida Ultimate" <sflultimate@gmail.com>',
    to: payload.email,
    subject: 'Registration Confirmation for ' + league.title,
    html: `
            <p>Thank you for your payment!</p>
            <p>Below you can find a receipt for your registration for ${league.title}.</p>
            <table style="border: 1px solid #dadada; padding: 4px;">
              <thead>
                <tr>
                  <th>Field</th>
                  <th>Your Submission</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>First Name</td><td>${payload.firstName}</td></tr>
                <tr><td>Last Name</td><td>${payload.lastName}</td></tr>
                <tr><td>Registration Level</td><td>${payload.registrationLevel}</td></tr>
                <tr><td>Amount Paid</td><td>$${payload.amount}</td></tr>
                <tr><td>Gender</td><td>${payload.gender}</td></tr>
                <tr><td>Participation</td><td>${payload.participation}</td></tr>
                <tr><td>Comments</td><td>${payload.comments}</td></tr>
                <tr><td>Email</td><td>${payload.email}</td></tr>
                <tr><td>Phone Number</td><td>${payload.phoneNumber}</td></tr>
                <tr><td>Age</td><td>${payload.age}</td></tr>
                <tr><td>Wanted to Captain</td><td>${payload.wouldCaptain ? 'Yes' : 'No'}</td></tr>
                <tr><td>Partner's Name</td><td>${payload.partnerName}</td></tr>
                <tr><td>Self-described athleticism level</td><td>${payload.athleticismLevel}</td></tr>
                <tr><td>Self-described experience level</td><td>${payload.experienceLevel}</td></tr>
                <tr><td>Self-described throws level</td><td>${payload.throwsLevel}</td></tr>
                <tr><td>Shirt Size</td><td>${payload.shirtSize}</td></tr>
              </tbody>
            </table>
            <p><em>Organized by South Florida Ultimate Inc., a local non-for-profit and social recreational club organized for the exclusive purposes of <strong>playing</strong>, <strong>promoting</strong>, and <strong>enjoying</strong> the sport known as Ultimate or Ultimate Frisbee.</em></p>
            <p>Follow us on:</p>
            <ul>
                <li><a href="https://instagram.com/sflultimate">Instagram</a></li>
                <li><a href="https://www.facebook.com/sflultimate">Facebook</a></li>
                <li><a href="https://www.tiktok.com/@sflultimate">TikTok</a></li>
                <li><a href="https://chat.whatsapp.com/FZC77g5Tzsw8xwxMXG997V">WhatsApp</a></li>
            </ul>
          `
  }

  return transporter.sendMail(emailSendParams)
}
