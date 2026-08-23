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
    let errorMessage
    if (payload.firstName && payload.lastName && payload.email) {
      errorMessage = `Payment failed for ${payload.firstName} ${payload.lastName} (${payload.email})`
    } else {
      errorMessage = 'Payment failed'
    }
    if (paymentResult.transaction && paymentResult.transaction.status) {
      errorMessage = ': ' + paymentResult.transaction.status
    }
    throw new Error(errorMessage)
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

  const jerseyStatus = payload.shirtSize && payload.shirtSize !== 'NA'
    ? `${payload.registrationLevel === 'Adult' ? 'Yes' : 'Included'} (size: ${payload.shirtSize})`
    : 'No'

  const emailSendParams = {
    from: 'South Florida Ultimate <sflultimate@gmail.com>',
    to: payload.email,
    subject: 'Registration Confirmation for ' + league.title,
    html: `
            <div style="margin: 0; padding: 32px 12px; background-color: #f4f2f5; color: #2d2d2d; font-family: Arial, Helvetica, sans-serif; line-height: 1.5;">
              <div style="max-width: 600px; margin: 0 auto; overflow: hidden; background-color: #ffffff; border: 1px solid #e3dee5; border-radius: 12px; box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);">
                <div style="padding: 24px; text-align: center; background-color: #ffffff; border-bottom: 4px solid #804399;">
                  <img src="https://www.sflultimate.com/images/sflultimate-logo-pink-flamingo.png" alt="South Florida Ultimate" style="display: block; width: 220px; max-width: 100%; height: auto; margin: 0 auto;" />
                </div>
                <div style="padding: 32px 28px;">
                  <div style="margin-bottom: 24px; text-align: center;">
                    <div style="display: inline-block; margin-bottom: 12px; padding: 6px 12px; border-radius: 999px; background-color: #eaf7ee; color: #237a3b; font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">Registration confirmed</div>
                    <h1 style="margin: 0 0 8px; color: #2d2d2d; font-size: 26px; line-height: 1.25;">You&apos;re registered!</h1>
                    <p style="margin: 0; color: #666666; font-size: 16px;">Thanks, ${payload.firstName}. We received your registration for <strong>${league.title}</strong>.</p>
                  </div>

                  <div style="margin-bottom: 24px; padding: 18px 20px; border-radius: 8px; background-color: #f8f5f9; border-left: 4px solid #804399;">
                    <p style="margin: 0 0 4px; color: #666666; font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">Order total</p>
                    <p style="margin: 0; color: #804399; font-size: 28px; font-weight: bold;">$${payload.amount}</p>
                  </div>

                  <h2 style="margin: 0 0 12px; color: #2d2d2d; font-size: 19px;">Order summary</h2>
                  <table role="presentation" style="width: 100%; border: 1px solid #e3dee5; border-collapse: separate; border-spacing: 0; border-radius: 8px; overflow: hidden; font-size: 14px;">
                    <tbody>
                      <tr style="background-color: #f8f5f9;"><td style="width: 45%; padding: 11px 14px; border-bottom: 1px solid #e8e3ea; color: #666666; font-weight: bold;">Name</td><td style="padding: 11px 14px; border-bottom: 1px solid #e8e3ea;">${payload.firstName} ${payload.lastName}</td></tr>
                      <tr><td style="padding: 11px 14px; border-bottom: 1px solid #e8e3ea; color: #666666; font-weight: bold;">Registration type</td><td style="padding: 11px 14px; border-bottom: 1px solid #e8e3ea;">${payload.registrationLevel}</td></tr>
                      <tr style="background-color: #f8f5f9;"><td style="padding: 11px 14px; border-bottom: 1px solid #e8e3ea; color: #666666; font-weight: bold;">Jersey</td><td style="padding: 11px 14px; border-bottom: 1px solid #e8e3ea;">${jerseyStatus}</td></tr>
                      <tr><td style="padding: 11px 14px; border-bottom: 1px solid #e8e3ea; color: #666666; font-weight: bold;">Gender</td><td style="padding: 11px 14px; border-bottom: 1px solid #e8e3ea;">${payload.gender}</td></tr>
                      <tr style="background-color: #f8f5f9;"><td style="padding: 11px 14px; border-bottom: 1px solid #e8e3ea; color: #666666; font-weight: bold;">Participation</td><td style="padding: 11px 14px; border-bottom: 1px solid #e8e3ea;">${payload.participation}</td></tr>
                      <tr><td style="padding: 11px 14px; border-bottom: 1px solid #e8e3ea; color: #666666; font-weight: bold;">Age</td><td style="padding: 11px 14px; border-bottom: 1px solid #e8e3ea;">${payload.age}</td></tr>
                      <tr style="background-color: #f8f5f9;"><td style="padding: 11px 14px; border-bottom: 1px solid #e8e3ea; color: #666666; font-weight: bold;">Captain interest</td><td style="padding: 11px 14px; border-bottom: 1px solid #e8e3ea;">${payload.wouldCaptain ? 'Yes' : 'No'}</td></tr>
                      <tr><td style="padding: 11px 14px; border-bottom: 1px solid #e8e3ea; color: #666666; font-weight: bold;">Partner</td><td style="padding: 11px 14px; border-bottom: 1px solid #e8e3ea;">${payload.partnerName || 'None requested'}</td></tr>
                      <tr style="background-color: #f8f5f9;"><td style="padding: 11px 14px; border-bottom: 1px solid #e8e3ea; color: #666666; font-weight: bold;">Athleticism level</td><td style="padding: 11px 14px; border-bottom: 1px solid #e8e3ea;">${payload.athleticismLevel}</td></tr>
                      <tr><td style="padding: 11px 14px; border-bottom: 1px solid #e8e3ea; color: #666666; font-weight: bold;">Experience level</td><td style="padding: 11px 14px; border-bottom: 1px solid #e8e3ea;">${payload.experienceLevel}</td></tr>
                      <tr style="background-color: #f8f5f9;"><td style="padding: 11px 14px; border-bottom: 1px solid #e8e3ea; color: #666666; font-weight: bold;">Throws level</td><td style="padding: 11px 14px; border-bottom: 1px solid #e8e3ea;">${payload.throwsLevel}</td></tr>
                      <tr><td style="padding: 11px 14px; color: #666666; font-weight: bold;">Comments</td><td style="padding: 11px 14px;">${payload.comments || 'None'}</td></tr>
                      <tr style="background-color: #f8f5f9;"><td style="padding: 11px 14px; border-bottom: 1px solid #e8e3ea; color: #666666; font-weight: bold;">Email</td><td style="padding: 11px 14px; border-bottom: 1px solid #e8e3ea;">${payload.email}</td></tr>
                      <tr><td style="padding: 11px 14px; color: #666666; font-weight: bold;">Phone Number</td><td style="padding: 11px 14px;">${payload.phoneNumber}</td></tr>
                    </tbody>
                  </table>
                </div>

                <div style="padding: 24px; text-align: center; background-color: #302d31; color: #ffffff;">
                  <p style="margin: 0 0 12px; font-size: 16px;"><strong>Stay connected with South Florida Ultimate</strong></p>
                  <p style="margin: 0 0 16px; line-height: 2;">
                    <a href="https://www.instagram.com/sflultimate/" style="margin: 0 7px; color: #ffffff; font-weight: bold; text-decoration: none;">Instagram</a>
                    <a href="https://www.facebook.com/sflultimate/" style="margin: 0 7px; color: #ffffff; font-weight: bold; text-decoration: none;">Facebook</a>
                    <a href="https://www.tiktok.com/@sflultimate" style="margin: 0 7px; color: #ffffff; font-weight: bold; text-decoration: none;">TikTok</a>
                    <a href="https://www.youtube.com/sflultimate/" style="margin: 0 7px; color: #ffffff; font-weight: bold; text-decoration: none;">YouTube</a>
                    <a href="https://chat.whatsapp.com/FZC77g5Tzsw8xwxMXG997V" style="margin: 0 7px; color: #ffffff; font-weight: bold; text-decoration: none;">WhatsApp</a>
                  </p>
                  <p style="margin: 0; color: #c8c3ca; font-size: 12px;">
                    Organized by South Florida Ultimate Inc., a local non-for-profit and social recreational club organized for the exclusive purposes of <strong>playing</strong>, <strong>promoting</strong>, and <strong>enjoying</strong> the sport known as Ultimate or Ultimate Frisbee.
                  </p>
                  <p style="margin: 6px 0 0; color: #c8c3ca; font-size: 12px;">sflultimate.com</p>
                </div>
              </div>
            </div>
          `
  }

  return transporter.sendMail(emailSendParams)
}
