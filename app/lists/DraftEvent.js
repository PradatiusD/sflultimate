const { Text, Integer, Relationship, DateTimeUtc } = require('@keystonejs/fields')

module.exports = {
  access: {
    read: ({ authentication }) => Boolean(authentication?.item && authentication.listKey === 'User'),
    create: false,
    update: false,
    delete: false
  },
  adminConfig: { defaultColumns: 'draftSessionId, type, teamId, playerId, createdAt' },
  fields: {
    draftSessionId: { type: Relationship, ref: 'DraftSession', isRequired: true },
    type: { type: Text, isRequired: true },
    pickId: { type: Relationship, ref: 'DraftPick' },
    teamId: { type: Relationship, ref: 'Team' },
    playerId: { type: Relationship, ref: 'Player' },
    selectionNumber: { type: Integer },
    teamCount: { type: Integer },
    createdAt: { type: DateTimeUtc }
  },
  adapterConfig: {
    mongooseSchemaOptions: { collection: 'draft_events' },
    configureMongooseSchema: schema => {
      schema.index({ draftSessionId: 1, createdAt: 1 })
    }
  }
}
