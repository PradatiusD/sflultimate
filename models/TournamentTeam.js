const keystone = require('keystone')
const { Types } = keystone.Field
const { Schema } = require('mongoose')

/**
 * Tournament Team Model
 * =========================
 */

const TournamentTeam = new keystone.List('TournamentTeam', {})

TournamentTeam.add({
  organizer_name: {
    type: Types.Name,
    initial: true,
    required: true,
    index: true
  },
  organizer_email: {
    type: Types.Email,
    initial: true,
    required: true,
    index: true
  }
})

TournamentTeam.schema.add({
  players: {
    type: Schema.Types.Mixed
  }
})

TournamentTeam.register()
