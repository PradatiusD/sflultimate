const keystone = require('keystone')
const Types = keystone.Field.Types
const storage = require('./file-storage-adapter')

const ClubTeamModel = new keystone.List('ClubTeam')

const fields = {
  name: {
    type: Types.Text,
    initial: true,
    required: true
  },
  category: {
    type: Types.Select,
    options: ['Mixed', 'Open', 'Women', 'College - Women', 'College - Mixed', 'College - Open'],
    initial: true
  },
  order: {
    type: Types.Number,
    initial: true,
    required: true
  },
  active: {
    type: Types.Boolean,
    required: true,
    initial: true
  },
  description: {
    type: String,
    initial: true,
    required: true
  },
  image: {
    type: Types.File,
    storage: storage
  },
  instagramPageUrl: {
    type: Types.Url
  },
  facebookPageUrl: {
    type: Types.Url
  },
  websiteUrl: {
    type: Types.Url
  },
  twitterPageUrl: {
    type: Types.Url
  },
  interestFormPageUrl: {
    type: Types.Url
  }
}

ClubTeamModel.add(fields)

/**
 * Registration
 */

ClubTeamModel.defaultColumns = 'name, order, active, description, image'
ClubTeamModel.register()
