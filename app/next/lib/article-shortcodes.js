const fs = require('fs')
const path = require('path')

const SHORTCODE_DEFINITIONS = {
  'colombia-earthquake-map': {
    assetFileName: 'earthquake-map.html'
  }
}

const SCRIPT_TAG_PATTERN = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi

const assetCache = {}

function resolveAssetPath (assetFileName) {
  const candidatePaths = [
    path.resolve(process.cwd(), 'shortcodes', assetFileName),
    path.resolve(process.cwd(), 'app', 'shortcodes', assetFileName)
  ]

  const assetPath = candidatePaths.find(candidatePath => fs.existsSync(candidatePath))

  if (!assetPath) {
    throw new Error('Unable to locate article shortcode asset: ' + candidatePaths[0])
  }

  return assetPath
}

function loadShortcodeAsset (definition) {
  const assetContents = fs.readFileSync(resolveAssetPath(definition.assetFileName), 'utf8')
  const footerScripts = []
  const markup = assetContents.replace(SCRIPT_TAG_PATTERN, function (match, attrs = '', content = '') {
    const srcMatch = attrs.match(/\bsrc=(['"])(.*?)\1/i)

    if (srcMatch) {
      footerScripts.push({ src: srcMatch[2] })
    } else if (content.trim()) {
      footerScripts.push({ content: content.trim() })
    }

    return ''
  }).trim()

  return { markup, footerScripts }
}

function getShortcodeAsset (shortcodeType) {
  if (!assetCache[shortcodeType]) {
    assetCache[shortcodeType] = loadShortcodeAsset(SHORTCODE_DEFINITIONS[shortcodeType])
  }

  return assetCache[shortcodeType]
}

function escapeRegExp (value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function getShortcodePattern (shortcodeType) {
  const escapedShortcodeType = escapeRegExp(shortcodeType)
  const quotePattern = '(?:"|\'|&quot;|&#34;|“|”|&ldquo;|&rdquo;)'
  const shortcodePattern = `\\[shortcode-type=${quotePattern}${escapedShortcodeType}${quotePattern}\\]`

  return {
    tokenPattern: new RegExp(shortcodePattern, 'gi'),
    wrappedParagraphPattern: new RegExp(`<p[^>]*>\\s*${shortcodePattern}\\s*<\\/p>`, 'gi')
  }
}

function replaceShortcodeToken (html, shortcodeType, replacementMarkup) {
  const { tokenPattern, wrappedParagraphPattern } = getShortcodePattern(shortcodeType)

  return html
    .replace(wrappedParagraphPattern, replacementMarkup)
    .replace(tokenPattern, replacementMarkup)
}

function appendUniqueFooterScript (footerScripts, script) {
  const alreadyIncluded = footerScripts.some(existingScript => {
    return existingScript.src === script.src && existingScript.content === script.content
  })

  if (!alreadyIncluded) {
    footerScripts.push(script)
  }
}

function expandArticleShortcodes (body = '') {
  let html = body
  const footerScripts = []

  Object.keys(SHORTCODE_DEFINITIONS).forEach(shortcodeType => {
    const { tokenPattern } = getShortcodePattern(shortcodeType)

    if (!tokenPattern.test(html)) {
      return
    }

    tokenPattern.lastIndex = 0
    const asset = getShortcodeAsset(shortcodeType)
    html = replaceShortcodeToken(html, shortcodeType, asset.markup)
    asset.footerScripts.forEach(script => appendUniqueFooterScript(footerScripts, script))
  })

  return { html, footerScripts }
}

module.exports = {
  expandArticleShortcodes
}
