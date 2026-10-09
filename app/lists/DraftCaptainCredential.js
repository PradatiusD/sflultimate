const { Text, Integer, Relationship, DateTimeUtc } = require('@keystonejs/fields')

module.exports = {
  access: {
    read: ({ authentication }) => Boolean(authentication?.item && authentication.listKey === 'User'),
    create: false,
    update: false,
    delete: false
  },
  adminConfig: { defaultColumns: 'draftSessionId, teamId, lastLoginAt, lockedUntil' },
  fields: {
    draftSessionId: { type: Relationship, ref: 'DraftSession', isRequired: true },
    teamId: { type: Relationship, ref: 'Team', isRequired: true },
    // Sudo-only, including in development where other lists allow public access.
    salt: { type: Text, access: false },
    hash: { type: Text, access: false },
    failedAttempts: { type: Integer, defaultValue: 0 },
    lockedUntil: { type: DateTimeUtc },
    lastLoginAt: { type: DateTimeUtc },
    createdAt: { type: DateTimeUtc },
    updatedAt: { type: DateTimeUtc }
  },
  adapterConfig: {
    mongooseSchemaOptions: { collection: 'draft_captain_credentials' },
    configureMongooseSchema: schema => {
      schema.index({ draftSessionId: 1, teamId: 1 }, { unique: true })
    }
  }
}
