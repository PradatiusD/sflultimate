const DEFAULT_SITE_URL = 'https://www.sflultimate.com'
const DEFAULT_SITE_NAME = 'South Florida Ultimate'
const DEFAULT_DESCRIPTION = 'South Florida Ultimate organizes leagues, pickups, events, news, teams, and community programs across Miami-Dade, Broward, and Palm Beach.'
const DEFAULT_IMAGE_PATH = '/images/open-graph/homepage.jpg'
const DEFAULT_IMAGE_WIDTH = 1200
const DEFAULT_IMAGE_HEIGHT = 630
const DEFAULT_LOCALE = 'en_US'

function stripHtmlTags (value = '') {
  return value.replace(/<[^>]*>/g, ' ')
}

function normalizeWhitespace (value = '') {
  return value.replace(/\s+/g, ' ').trim()
}

function sanitizeMetaText (value) {
  if (!value) {
    return ''
  }

  return normalizeWhitespace(stripHtmlTags(String(value)))
}

function getSiteUrl () {
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || DEFAULT_SITE_URL
  return configuredSiteUrl.replace(/\/$/, '')
}

function buildAbsoluteUrl (pathOrUrl) {
  if (!pathOrUrl) {
    return getSiteUrl()
  }

  if (/^https?:\/\//i.test(pathOrUrl)) {
    return pathOrUrl
  }

  if (pathOrUrl === '/') {
    return getSiteUrl() + '/'
  }

  const normalizedPath = pathOrUrl.startsWith('/') ? pathOrUrl : '/' + pathOrUrl
  return getSiteUrl() + normalizedPath
}

function getDefaultRobotsContent (noindex) {
  if (noindex) {
    return 'noindex,nofollow,noarchive'
  }

  return 'index,follow,max-image-preview:large'
}

function buildSeoMeta (options = {}) {
  const title = sanitizeMetaText(options.title) || DEFAULT_SITE_NAME
  const description = sanitizeMetaText(options.description) || DEFAULT_DESCRIPTION
  const keywords = sanitizeMetaText(options.keywords)
  const canonicalUrl = buildAbsoluteUrl(options.canonicalUrl || options.canonicalPath || options.path || '/')
  const openGraphUrl = buildAbsoluteUrl(options.ogUrl || options.path || canonicalUrl)
  const resolvedImagePath = options.image === false ? null : (options.image || DEFAULT_IMAGE_PATH)
  const image = resolvedImagePath ? buildAbsoluteUrl(resolvedImagePath) : null
  const ogTitle = sanitizeMetaText(options.ogTitle) || title
  const ogDescription = sanitizeMetaText(options.ogDescription) || description
  const twitterTitle = sanitizeMetaText(options.twitterTitle) || ogTitle
  const twitterDescription = sanitizeMetaText(options.twitterDescription) || ogDescription
  const robots = options.robots || getDefaultRobotsContent(Boolean(options.noindex))
  const hasImageDimensions = Boolean(
    (options.imageWidth && options.imageHeight) ||
    resolvedImagePath === DEFAULT_IMAGE_PATH ||
    resolvedImagePath === buildAbsoluteUrl(DEFAULT_IMAGE_PATH)
  )

  return {
    title,
    description,
    keywords,
    canonicalUrl,
    robots,
    siteName: sanitizeMetaText(options.siteName) || DEFAULT_SITE_NAME,
    locale: options.locale || DEFAULT_LOCALE,
    ogType: options.ogType || 'website',
    ogTitle,
    ogDescription,
    ogUrl: openGraphUrl,
    ogImage: image,
    ogImageWidth: hasImageDimensions ? String(options.imageWidth || DEFAULT_IMAGE_WIDTH) : null,
    ogImageHeight: hasImageDimensions ? String(options.imageHeight || DEFAULT_IMAGE_HEIGHT) : null,
    ogImageAlt: sanitizeMetaText(options.imageAlt),
    twitterCard: options.twitterCard || (image ? 'summary_large_image' : 'summary'),
    twitterTitle,
    twitterDescription,
    twitterImage: image,
    publishedTime: options.publishedTime || null,
    modifiedTime: options.modifiedTime || null
  }
}

export {
  buildAbsoluteUrl,
  buildSeoMeta,
  getSiteUrl,
  sanitizeMetaText,
  stripHtmlTags
}
