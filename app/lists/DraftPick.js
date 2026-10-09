const { Text, Integer, Checkbox, Relationship, DateTimeUtc } = require('@keystonejs/fields')

module.exports = {
  access: {
    read: ({ authentication }) => Boolean(authentication?.item && authentication.listKey === 'User'),
    create: false,
    update: false,
    delete: false
  },
  adminConfig: { defaultColumns: 'draftSessionId, selectionNumber, teamId, playerId, selectedAt' },
  fields: {
    draftSessionId: { type: Relationship, ref: 'DraftSession', isRequired: true },
    leagueId: { type: Relationship, ref: 'League', isRequired: true },
    teamId: { type: Relationship, ref: 'Team', isRequired: true },
    playerId: { type: Relationship, ref: 'Player', isRequired: true },
    scheduledTeamId: { type: Relationship, ref: 'Team' },
    priorNextTeamOverrideId: { type: Relationship, ref: 'Team' },
    selectionNumber: { type: Integer, isRequired: true },
    snakePosition: { type: Integer },
    roundNumber: { type: Integer },
    selectedByRole: { type: Text },
    advancedSequence: { type: Checkbox },
    isCommissionerOverride: { type: Checkbox },
    overrideNote: { type: Text },
    selectedAt: { type: DateTimeUtc }
  },
  adapterConfig: {
    mongooseSchemaOptions: { collection: 'draft_picks' },
    configureMongooseSchema: schema => {
      schema.index({ draftSessionId: 1, playerId: 1 }, { unique: true })
      schema.index({ draftSessionId: 1, selectionNumber: 1 }, { unique: true })
    }
  }
}
