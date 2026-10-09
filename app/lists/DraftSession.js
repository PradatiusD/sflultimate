const { Text, Integer, Checkbox, Relationship, DateTimeUtc } = require('@keystonejs/fields')

module.exports = {
  // Only the authorized draft endpoints use sudo; even administrators cannot
  // bypass the draft concurrency checks with direct GraphQL mutations.
  access: {
    read: ({ authentication }) => Boolean(authentication?.item && authentication.listKey === 'User'),
    create: false,
    update: false,
    delete: false
  },
  adminConfig: { defaultColumns: 'leagueId, status, currentPickNumber, version, updatedAt' },
  fields: {
    leagueId: { type: Relationship, ref: 'League', isRequired: true },
    status: { type: Text, defaultValue: 'setup' },
    orderJson: { type: Text },
    currentPickNumber: { type: Integer, defaultValue: 0 },
    selectionCount: { type: Integer, defaultValue: 0 },
    nextTeamOverrideId: { type: Relationship, ref: 'Team' },
    version: { type: Integer, defaultValue: 1 },
    showCommentsToCaptains: { type: Checkbox, defaultValue: false },
    operationToken: { type: Text },
    createdAt: { type: DateTimeUtc },
    updatedAt: { type: DateTimeUtc },
    startedAt: { type: DateTimeUtc },
    completedAt: { type: DateTimeUtc }
  },
  adapterConfig: {
    mongooseSchemaOptions: { collection: 'draft_sessions' },
    configureMongooseSchema: (schema, { mongoose }) => {
      // Retain the original ordered ObjectId array without rewriting existing drafts.
      schema.add({ teamOrder: [{ type: mongoose.Schema.Types.ObjectId }] })
      schema.path('leagueId').index({ unique: true })
    }
  }
}
