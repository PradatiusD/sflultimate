const MailerLite = require('@mailerlite/mailerlite-nodejs').default

async function createSubscriber ({ email, name }) {
  if (process.env.NODE_ENV !== 'production') return

  try {
    const apiKey = process.env.MAILERLITE_API_KEY
    if (!apiKey) throw new Error('MAILERLITE_API_KEY is not configured')

    const mailerlite = new MailerLite({ api_key: apiKey })
    const payload = {
      email,
      fields: { name },
      resubscribe: false
    }
    await mailerlite.subscribers.createOrUpdate(payload)
  } catch (error) {
    console.error('MailerLite subscriber creation failed:', error.message)
  }
}

module.exports = { createSubscriber }
