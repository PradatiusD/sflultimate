const keystone = require('keystone')
const Types = keystone.Field.Types
const storage = require('./file-storage-adapter')

const ClubTeamModel = new keystone.List('Event')

const fields = {
  name: {
    type: Types.Text,
    initial: true,
    required: true
  },
  category: {
    type: Types.Text,
    initial: true
  },
  startTime: {
    type: Types.Datetime,
    initial: true,
    required: true
  },
  endTime: {
    type: Types.Datetime,
    required: true,
    initial: true
  },
  location: {
    type: String,
    initial: true,
    required: true
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
  moreInformationUrl: {
    type: Types.Url
  }
}

ClubTeamModel.add(fields)

/**
 * Registration
 */

ClubTeamModel.defaultColumns = 'name, order, active, description, image'
ClubTeamModel.register()
