const keystone = require('keystone')
const Types = keystone.Field.Types

/**
 * Player Model
 * ==============
 */

const HatterPlayer = new keystone.List('HatterPlayer')

const fields = {
  name: {
    type: Types.Name,
    initial: true,
    required: true,
    index: true
  },
  gender: {
    type: Types.Select,
    options: ['Male', 'Female', 'Other'],
    initial: true
  },
  email: {
    type: Types.Email,
    initial: true,
    required: true,
    index: true
  },
  skillLevel: {
    type: Types.Select,
    options: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    initial: true,
    required: true
  },
  partners: {
    type: String,
    initial: true,
    required: false
  },
  comments: {
    type: String,
    required: false
  },
  dates_registered: {
    type: Types.TextArray,
    options: [
      '2020-01-11',
      '2020-02-02',
      '2019-01-05',
      '2019-02-02',
      '2018-03-02'
    ],
    initial: true,
    required: true
  }
}

HatterPlayer.add(fields)

/**
 * Registration
 */

HatterPlayer.defaultColumns = 'name, gender, email, dates_registered'
HatterPlayer.register()
