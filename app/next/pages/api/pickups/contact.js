import { gql } from '@apollo/client'
import GraphqlClient from '../../../lib/graphql-client'
import PaymentUtils from '../../../lib/payment-utils'

const { RECAPTCHA_V2_SITE_SECRET } = process.env

const CONTACT_FIELD_BY_TYPE = {
  whatsapp: 'contactWhatsapp',
  email: 'contactEmail',
  phone: 'contactPhone'
}

function buildContactResponse (contactType, contactValue) {
  if (contactType === 'whatsapp') {
    return {
      href: contactValue,
      target: '_blank',
      value: contactValue
    }
  }

  if (contactType === 'email') {
    return {
      href: `mailto:${contactValue}`,
      target: '_blank',
      value: contactValue
    }
  }

  return {
    href: `sms:${contactValue}`,
    target: '_self',
    value: contactValue
  }
}

export default async function handler (req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    res.status(405).json({ error: `Method ${req.method} Not Allowed` })
    return
  }

  const { pickupId, contactType, recaptchaToken } = req.body || {}

  if (!pickupId || !contactType || !recaptchaToken || !CONTACT_FIELD_BY_TYPE[contactType]) {
    res.status(400).json({ error: 'Missing required contact verification parameters.' })
    return
  }

  try {
    if (!RECAPTCHA_V2_SITE_SECRET) {
      res.status(500).json({ error: 'Pickup contact verification is not configured.' })
      return
    }

    const recaptchaResponse = await PaymentUtils.validateRecaptchaToken(recaptchaToken, {
      secretKey: RECAPTCHA_V2_SITE_SECRET
    })
    if (!recaptchaResponse || !recaptchaResponse.success) {
      res.status(403).json({ error: 'reCAPTCHA verification failed. Please try again.' })
      return
    }

    const results = await GraphqlClient.query({
      query: gql`
        query($pickupId: ID) {
          allPickups(where: {id: $pickupId}, first: 1) {
            id
            contactWhatsapp
            contactEmail
            contactPhone
          }
        }
      `,
      variables: {
        pickupId
      }
    })

    const pickup = results.data.allPickups[0]
    if (!pickup) {
      res.status(404).json({ error: 'Pickup not found.' })
      return
    }

    const contactField = CONTACT_FIELD_BY_TYPE[contactType]
    const contactValue = pickup[contactField]

    if (!contactValue) {
      res.status(404).json({ error: 'That contact method is not available for this pickup.' })
      return
    }

    res.status(200).json(buildContactResponse(contactType, contactValue))
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Unable to reveal this contact method right now.' })
  }
}
