const { Text, Integer, Checkbox, Relationship } = require('@keystonejs/fields')
const keystone = require('./../keystone')

/**
 * Board Position Model
 * ==============
 */

const fields = {
  title: {
    type: Text,
    required: true
  },
  order: {
    type: Integer,
    required: true
  },
  active: {
    type: Checkbox,
    required: true
  },
  description: {
    type: Text,
    required: true
  },
  commitment: {
    type: Text,
    required: true
  },
  assigned: {
    type: Relationship,
    ref: 'BoardMember',
    many: true
  }
}

module.exports = {
  fields,
  adminConfig: {
    defaultColumns: 'title, description, commitment, assigned',
  },
  labelResolver: async (item) => {
    const itemResponse = await keystone.executeGraphQL({
      query: `query {
          BoardPosition(where: {id: "${item.id}" }) {
            assigned {
              id
            }
          }
        }`
    })

    if (itemResponse.data.BoardPosition.assigned.length === 0) {
      return 'Vacant'
    }

    const { data } = await keystone.executeGraphQL({
      query: `query {
          BoardMember(where: {id: "${itemResponse.data.BoardPosition.assigned[0].id}" }) {
            firstName,
            lastName
          }
        }`
    })

    return `${data.BoardMember.firstName} ${data.BoardMember.lastName}`
  }
}
