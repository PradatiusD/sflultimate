import { list } from '@keystone-6/core'
import { allowAll } from '@keystone-6/core/access'
import { file, integer, relationship, text } from '@keystone-6/core/fields'

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

export default list({
  access: allowAll,
  fields: {
    name: text({ validation: { isRequired: true }, isIndexed: true }),
    slug: text({ isIndexed: true }),
    color: text(),
    captains: relationship({ ref: 'Player', many: true }),
    players: relationship({ ref: 'Player', many: true }),
    league: relationship({ ref: 'League' }),
    draftOrder: integer(),
    image: file({ storage: 'local_files' })
  },
  hooks: {
    resolveInput: ({ resolvedData, item }) => {
      const nextName = resolvedData.name || item?.name || ''
      const nextSlug = resolvedData.slug || item?.slug || ''

      if (nextSlug) {
        resolvedData.slug = slugifyTeamName(nextSlug)
      } else if (nextName) {
        resolvedData.slug = slugifyTeamName(nextName)
      }

      return resolvedData
    }
  },
  ui: {
    labelField: 'name',
    listView: {
      initialColumns: ['name', 'slug', 'league', 'captains', 'color', 'image']
    }
  }
})
