const assert = require('assert')
const path = require('path')
const vm = require('vm')
const { transformFileSync } = require('@babel/core')

const { code } = transformFileSync(path.resolve(__dirname, '../app/next/components/ShortcodeContent.js'), {
  babelrc: false,
  configFile: false,
  presets: [['@babel/preset-react', { runtime: 'automatic' }]],
  plugins: ['@babel/plugin-transform-modules-commonjs']
})
const exportsObject = {}
let effect
let appended = []
let embeds = []
const contentRef = { current: { querySelectorAll: () => embeds } }
vm.runInNewContext(code, {
  exports: exportsObject,
  require: name => name === 'react' ? { useEffect: callback => { effect = callback }, useRef: () => contentRef } : require(name),
  URL,
  document: {
    readyState: 'complete',
    createElement: () => ({ remove () { this.removed = true } }),
    body: { appendChild: element => appended.push(element) }
  }
})
const ShortcodeContent = exportsObject.default
const html = '<blockquote class="instagram-media" data-instgrm-permalink="https://www.instagram.com/reel/DcUPi6_RsbF/"></blockquote>'
const footerScripts = []
const rendered = ShortcodeContent({ html, footerScripts })
assert.strictEqual(rendered.props.dangerouslySetInnerHTML.__html, html)
const cleanup = effect()
assert.strictEqual(appended.length, 1, 'Instagram markup loads the embed script even without shortcode scripts')
assert.strictEqual(appended[0].src, 'https://www.instagram.com/embed.js')
assert.strictEqual(footerScripts.length, 0, 'props are not mutated')
cleanup()
assert.ok(appended[0].removed)

appended = []
ShortcodeContent({ html: '<p>Ordinary event</p>' })
effect()()
assert.strictEqual(appended.length, 0)

ShortcodeContent({ html: '<div>Widget</div>', footerScripts: [{ content: 'widget()' }] })
effect()()
assert.strictEqual(appended[0].text, 'widget()')
assert.ok(appended[0].removed)

appended = []
const fundraiser = '<div class="gfm-embed" data-url="https://www.gofundme.com/f/example/widget/large"></div>'
ShortcodeContent({ html: fundraiser + fundraiser, footerScripts })
effect()()
assert.strictEqual(appended.length, 1, 'GoFundMe script loads once per content block')
assert.strictEqual(appended[0].src, 'https://www.gofundme.com/static/js/embed.js')
assert.strictEqual(appended[0].defer, true)
assert.ok(appended[0].removed)
assert.strictEqual(footerScripts.length, 0)

appended = []
ShortcodeContent({ html: html + fundraiser })
effect()()
assert.strictEqual(appended.length, 2, 'Instagram and GoFundMe can coexist')

appended = []
const frames = []
embeds = [{
  dataset: { url: 'https://www.gofundme.com/f/example/widget/large' },
  querySelector: () => frames[0],
  appendChild: frame => frames.push(frame)
}]
ShortcodeContent({ html: fundraiser })
const cleanupFundraiser = effect()
assert.strictEqual(typeof appended[0].onload, 'function', 'Late-loaded GoFundMe script initializes the widgets')
appended[0].onload()
assert.strictEqual(frames.length, 1)
assert.strictEqual(frames[0].src, embeds[0].dataset.url)
assert.strictEqual(frames[0].className, 'gfm-embed-iframe')
appended[0].onload()
assert.strictEqual(frames.length, 1, 'Existing iframes are not duplicated')
cleanupFundraiser()
assert.strictEqual(appended[0].onload, null)

console.log('Shortcode content tests passed: Instagram, GoFundMe, plain HTML, shortcode scripts, cleanup')

const newsExports = {}
const newsCode = transformFileSync(path.resolve(__dirname, '../app/next/pages/news/[slug].js'), {
  babelrc: false,
  configFile: false,
  presets: [['@babel/preset-react', { runtime: 'automatic' }]],
  plugins: ['@babel/plugin-transform-modules-commonjs']
}).code
const mocks = {
  '../../lib/server-graphql-client': {},
  '../../lib/global-server-side-props': {},
  '../../components/Navigation': { HeaderNavigation: () => null },
  '../../components/SeoHead': () => null,
  '../../components/ShortcodeContent': ShortcodeContent,
  '../../lib/utils': { showDate: () => '' },
  react: { useEffect: () => {} }
}
vm.runInNewContext(newsCode, {
  exports: newsExports,
  require: name => name in mocks ? mocks[name] : require(name)
})
const tree = newsExports.default({ post: { title: 'Test', slug: 'test', body: fundraiser, footerScripts } })
function findContent (element) {
  if (!element) return null
  if (element.type === ShortcodeContent) return element
  return [].concat(element.props?.children || []).map(findContent).find(Boolean)
}
const newsContent = findContent(tree)
assert.ok(newsContent, 'News uses the shared embed renderer')
assert.strictEqual(newsContent.props.html, fundraiser)
console.log('News embed integration test passed')
