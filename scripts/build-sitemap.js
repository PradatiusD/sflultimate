#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const superagent = require('superagent')

const SITE_URL = (process.env.SITEMAP_SITE_URL || 'https://www.sflultimate.com').replace(/\/$/, '')
const GRAPHQL_URL = process.env.SITEMAP_GRAPHQL_URL || 'http://localhost:3000/admin/api'
const OUTPUT_PATH = path.join(__dirname, '..', 'app', 'next', 'public', 'sitemap.xml')

const STATIC_ROUTES = [
  '/',
  '/news',
  '/events',
  '/pickups',
  '/register',
  '/schedule',
  '/stats',
  '/teams',
  '/gallery',
  '/club-teams',
  '/board',
  '/youth',
  '/beach-bash-tournament',
  '/privacy',
  '/terms'
]

const SITEMAP_QUERY = `
  query SitemapData {
    allLeagues(sortBy: registrationStart_DESC) {
      slug
      isActive
      registrationStart
      registrationEnd
      lateRegistrationEnd
    }
    allPickups(where: { isActive: true }, sortBy: order_ASC) {
      slug
      updatedAt
    }
    allEvents(sortBy: startTime_DESC) {
      slug
      startTime
      endTime
    }
    allPosts(sortBy: publishedDate_DESC) {
      slug
      publishedDate
    }
    allGalleries(where: { isActive: true }, sortBy: sortOrder_ASC) {
      slug
    }
  }
`

function escapeXml (value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function toAbsoluteUrl (pathname) {
  if (!pathname || pathname === '/') {
    return SITE_URL + '/'
  }

  return SITE_URL + pathname
}

function normalizeDate (value) {
  if (!value) {
    return null
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date.toISOString()
}

function createEntry (pathname, lastmod) {
  return {
    pathname,
    lastmod: normalizeDate(lastmod)
  }
}

function buildLeagueEntries (leagues) {
  const entries = []

  for (const league of leagues || []) {
    if (!league.slug) {
      continue
    }

    const leagueLastmod = league.lateRegistrationEnd || league.registrationEnd || league.registrationStart

    entries.push(createEntry(`/leagues/${league.slug}/teams`, leagueLastmod))
    entries.push(createEntry(`/leagues/${league.slug}/schedule`, leagueLastmod))
    entries.push(createEntry(`/leagues/${league.slug}/stats`, leagueLastmod))

    if (league.isActive) {
      entries.push(createEntry(`/leagues/${league.slug}/register`, leagueLastmod))
      entries.push(createEntry(`/leagues/${league.slug}/substitutions`, leagueLastmod))
    }
  }

  return entries
}

function buildDynamicEntries (data) {
  const entries = []

  for (const route of STATIC_ROUTES) {
    entries.push(createEntry(route))
  }

  entries.push(...buildLeagueEntries(data.allLeagues))

  for (const pickup of data.allPickups || []) {
    if (pickup.slug) {
      entries.push(createEntry(`/pickups/${pickup.slug}`, pickup.updatedAt))
    }
  }

  for (const event of data.allEvents || []) {
    if (event.slug) {
      entries.push(createEntry(`/events/${event.slug}`, event.endTime || event.startTime))
    }
  }

  for (const post of data.allPosts || []) {
    if (post.slug) {
      entries.push(createEntry(`/news/${post.slug}`, post.publishedDate))
    }
  }

  for (const gallery of data.allGalleries || []) {
    if (gallery.slug) {
      entries.push(createEntry(`/gallery/${gallery.slug}`))
    }
  }

  return entries
}

function dedupeEntries (entries) {
  const byPath = new Map()

  for (const entry of entries) {
    if (!entry.pathname) {
      continue
    }

    const existing = byPath.get(entry.pathname)
    if (!existing) {
      byPath.set(entry.pathname, entry)
      continue
    }

    if (!existing.lastmod && entry.lastmod) {
      byPath.set(entry.pathname, entry)
    }
  }

  return Array.from(byPath.values()).sort((a, b) => a.pathname.localeCompare(b.pathname))
}

function renderSitemapXml (entries) {
  const body = entries.map((entry) => {
    const lines = [
      '  <url>',
      `    <loc>${escapeXml(toAbsoluteUrl(entry.pathname))}</loc>`
    ]

    if (entry.lastmod) {
      lines.push(`    <lastmod>${escapeXml(entry.lastmod)}</lastmod>`)
    }

    lines.push('  </url>')
    return lines.join('\n')
  }).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`
}

async function fetchSitemapData () {
  try {
    const response = await superagent
      .post(GRAPHQL_URL)
      .set('Content-Type', 'application/json')
      .send({ query: SITEMAP_QUERY })

    if (response.body.errors && response.body.errors.length > 0) {
      throw new Error(response.body.errors.map(error => error.message).join('; '))
    }

    return response.body.data
  } catch (error) {
    const baseMessage = `Unable to fetch sitemap data from ${GRAPHQL_URL}.`
    const hint = 'Start the local app with `npm run dev`, then run `node scripts/build-sitemap.js` again.'
    throw new Error(`${baseMessage} ${hint}\n\nOriginal error: ${error.message}`)
  }
}

async function main () {
  const data = await fetchSitemapData()
  const entries = dedupeEntries(buildDynamicEntries(data))
  const xml = renderSitemapXml(entries)

  fs.writeFileSync(OUTPUT_PATH, xml)

  console.log(`Wrote ${entries.length} sitemap URLs to ${OUTPUT_PATH}`)
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
