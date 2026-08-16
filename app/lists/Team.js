const { Text, Relationship, Integer, File } = require('@keystonejs/fields')
const { Color } = require('@keystonejs/fields-color')
const storage = require('./file-storage-adapter')

function slugifyTeamName (value = '') {
  const normalizedValue = String(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return normalizedValue || 'team'
}

const fields = {
  name: {
    type: Text,
    isRequired: true,
    index: true
  },
  slug: {
    type: Text,
    index: true,
    initial: true
  },
  color: {
    type: Color
  },
  captains: {
    type: Relationship,
    ref: 'Player',
    many: true
  },
  players: {
    type: Relationship,
    ref: 'Player',
    many: true
  },
  league: {
    type: Relationship,
    ref: 'League',
    initial: true
  },
  draftOrder: {
    type: Integer
  },
  image: {
    type: File,
    adapter: storage
  }
}

module.exports = {
  fields,
  labelResolver: item => item.name,
  adminConfig: {
    defaultColumns: 'name, slug, league, captains, color'
  },
  hooks: {
    resolveInput: ({ resolvedData, existingItem }) => {
      const nextName = resolvedData.name || existingItem?.name || ''
      const nextSlug = resolvedData.slug || existingItem?.slug || ''

      if (nextSlug) {
        resolvedData.slug = slugifyTeamName(nextSlug)
      } else if (nextName) {
        resolvedData.slug = slugifyTeamName(nextName)
      }

      return resolvedData
    }
  }
}
