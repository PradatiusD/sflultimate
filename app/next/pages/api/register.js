const { gql } = require('@apollo/client')
const GraphQlClient = require('./../../lib/graphql-client')
const PaymentUtils = require('./../../lib/payment-utils')

const CREATE_PLAYER_MUTATION = gql`
  mutation CreatePlayer($data: PlayerCreateInput!) {
    createPlayer(data: $data) {
      id
      email
    }
  }
`
export default async function handler (req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
    return res
  }

  try {
    const purchase = {
      amount: 10,
      paymentMethodNonce: req.body.paymentMethodNonce,
      options: {
        submitForSettlement: true
      },
      customer: {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email
      },
      billing: {
        streetAddress: req.body.streetAddress
      },
      customFields: {
        partner: req.body.partnerName,
        gender: req.body.gender,
        skillLevel: req.body.skillLevel,
        participation: req.body.participation
      }
    }

    const paymentResult = await PaymentUtils.createSale(purchase)
    console.log(paymentResult)
    const results = await GraphQlClient.mutate({
      mutation: CREATE_PLAYER_MUTATION,
      variables: {
        data: {
          email: req.body.email,
          createdAt: new Date(),
          updatedAt: new Date(),
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          gender: req.body.gender,
          age: parseInt(req.body.age),
          skillLevel: parseInt(req.body.skillLevel),
          registrationLevel: req.body.registrationLevel,
          leagues: {
            connect: [{ id: req.body.league }]
          }
        }
      }
    })
    console.log(results)
    res.status(200).json({ message: 'Success', data: results })
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Error', data: e })
  }
}
