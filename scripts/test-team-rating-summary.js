const assert = require('assert')
const path = require('path')
const { createRequire } = require('module')
const { transformFileSync } = require('@babel/core')
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
const { parse } = require('node-html-parser')

process.env.NODE_ENV = 'test'
const filename = path.resolve(__dirname, '../app/next/components/TeamRatingSummary.js')
const { code } = transformFileSync(filename, {
  babelrc: false,
  configFile: false,
  presets: [require.resolve('next/babel')]
})
const componentModule = { exports: {} }
// Exercise the actual JSX with the existing Next.js Babel preset.
require('vm').runInThisContext(`(function (require, module, exports) { ${code}\n})`, { filename })(createRequire(filename), componentModule, componentModule.exports)
const Summary = componentModule.exports.default
const render = players => parse(renderToStaticMarkup(React.createElement(Summary, { players })))
const rows = table => table.querySelectorAll('tbody tr').map(row => row.querySelectorAll('th, td').map(cell => cell.text))
const player = (gender, athleticismLevel, experienceLevel, throwsLevel, participation) => ({ gender, athleticismLevel, experienceLevel, throwsLevel, participation })

const complete = render([
  player('Male', 4, 3, 2, 50),
  player('Female', 5, 4, 3, 80),
  player('Other', 1, 2, 3, 30)
])
assert(complete.text.includes('3 players · 1 MMP · 1 FMP · 1 other / unspecified'))
assert.deepStrictEqual(rows(complete.querySelectorAll('table')[0]), [
  ['Overall', '3.33', '3', '2.67', '3'],
  ['MMP', '4', '3', '2', '3'],
  ['FMP', '5', '4', '3', '4'],
  ['Other / unspecified', '1', '2', '3', '2']
])
assert.deepStrictEqual(rows(complete.querySelectorAll('table')[1]), [
  ['Overall', '3.94', '3.31', '2.69', '3.31'],
  ['MMP', '4', '3', '2', '3'],
  ['FMP', '5', '4', '3', '4'],
  ['Other / unspecified', '1', '2', '3', '2']
])
const partial = render([player('Male', 4, null, 2, null), player('Male', 2, 3, null, 50)])
assert.deepStrictEqual(rows(partial.querySelectorAll('table')[0])[0], ['Overall', '3', '3*', '2*', '2.67*'])
assert.deepStrictEqual(rows(partial.querySelectorAll('table')[1])[0], ['Overall', '2*', '3*', '—', '—'])
assert.deepStrictEqual(rows(partial.querySelectorAll('table')[1])[2], ['FMP', '—', '—', '—', '—'])
assert(partial.querySelector('[title="Some players are missing data"]'))
const zero = render([player('Female', 2, 3, 4, 0)])
assert.deepStrictEqual(rows(zero.querySelectorAll('table')[1])[0], ['Overall', '—', '—', '—', '—'])
const noAttendance = render([player('Male', 2, 3, 4, null)])
assert.deepStrictEqual(rows(noAttendance.querySelectorAll('table')[1])[0], ['Overall', '—', '—', '—', '—'])
for (const players of [[], [{ gender: 'Female', skillLevel: 9 }]]) {
  const result = render(players)
  assert(result.querySelector('#team-summary-heading'))
  assert.strictEqual(result.querySelectorAll('table').length, 0)
}
const heatmap = render([player('Male', 1, 3, 5, 80)])
for (const table of heatmap.querySelectorAll('table')) {
  const cells = table.querySelectorAll('tbody tr')[0].querySelectorAll('td')
  assert.deepStrictEqual(cells.map(cell => cell.getAttribute('style')), [
    'background-color:hsl(0, 75%, 85%);color:#212529',
    'background-color:hsl(60, 75%, 85%);color:#212529',
    'background-color:hsl(120, 75%, 85%);color:#212529',
    'background-color:hsl(60, 75%, 85%);color:#212529'
  ])
  assert(table.querySelectorAll('tbody tr')[2].querySelectorAll('td').every(cell => !cell.getAttribute('style')))
}
assert.strictEqual(heatmap.querySelectorAll('[aria-label="Rating color scale from 1, lowest, to 5, highest"] span[style]').length, 5)
console.log('Team rating summary checks passed: averages, missing data, gender counts, heatmap scale and neutral missing cells.')
