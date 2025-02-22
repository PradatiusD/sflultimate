const { gql } = require('@apollo/client')
const GraphQlClient = require('./../../lib/graphql-client')

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
    const results = await GraphQlClient.mutate({
      mutation: CREATE_PLAYER_MUTATION,
      variables: {
        data: {
          email: req.body.email,
          createdAt: new Date(),
          updatedAt: new Date(),
          firstName: 'test',
          lastName: 'test',
          age: 5,
          password: 'testtesttesttesttesttesttest',
          skillLevel: 1,
          registrationLevel: 'Adult'
        }
      }
    })
    console.log(results)
    res.status(200).json({ message: 'Success', data: `You sent: ${JSON.stringify(req.body, null, 2)}` })
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Error' })
  }
}
