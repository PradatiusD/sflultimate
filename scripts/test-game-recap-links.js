const assert = require('assert')
const path = require('path')
const { createRequire } = require('module')
const { transformFileSync } = require('@babel/core')
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
const { parse } = require('node-html-parser')

process.env.NODE_ENV = 'test'
function load (relativePath, overrides = {}) {
  const filename = path.resolve(__dirname, relativePath)
  const { code } = transformFileSync(filename, {
    babelrc: false,
    configFile: false,
    presets: [require.resolve('next/babel')]
  })
  const localRequire = createRequire(filename)
  const componentModule = { exports: {} }
  const requireDependency = name => Object.prototype.hasOwnProperty.call(overrides, name) ? overrides[name] : localRequire(name)
  require('vm').runInThisContext(`(function (require, module, exports) { ${code}\n})`, { filename })(requireDependency, componentModule, componentModule.exports)
  return componentModule.exports
}

const GameStatTable = load('../app/next/components/GameStatTable.js', {
  './PlayerLink': { PlayerLink: ({ player }) => React.createElement('span', null, player.firstName) }
}).default
const GamePage = load('../app/next/components/GamePage.js', {
  './Navigation': { HeaderNavigation: () => null },
  './Standings': () => null,
  './SeoHead': () => null,
  './PlayerLink': { PlayerLink: ({ player }) => React.createElement('span', null, player.firstName) },
  './GameStatTable': GameStatTable,
  '../lib/utils': { showDate: () => 'Test date', showHourMinute: () => 'Test time' },
  '../lib/team-utils': { buildTeamUrl: (_, team) => `/teams/${team.id}` },
  '../lib/game-url': load('../app/next/lib/game-url.js')
}).default
const teams = ['home', 'away'].map(id => ({
  id,
  name: id,
  players: [{ id: `${id}-player`, firstName: 'Sample', lastName: 'Player' }],
  stats: []
}))
const game = {
  id: 'game id',
  league: { id: 'league', slug: 'test-league', title: 'Test League' },
  scheduledTime: '2020-01-01T12:00:00Z',
  homeTeam: teams[0],
  awayTeam: teams[1]
}

for (const hasStats of [false, true]) {
  const fixtureTeams = teams.map(team => ({
    ...team,
    stats: hasStats ? [{ player: team.players[0], attended: true, assists: 1, scores: 1, defenses: 0, total: 2 }] : []
  }))
  for (const isLoggedIn of [false, true]) {
    for (const isGamePreview of [false, true]) {
      const html = parse(renderToStaticMarkup(React.createElement(GamePage, { game, teams: fixtureTeams, games: [], leagues: [], isLoggedIn, isGamePreview })))
      const columns = html.querySelectorAll('.col-sm-6')
      assert.strictEqual(columns.length, 2)
      columns.forEach((column, index) => {
        assert(column.querySelector('table'))
        const links = column.querySelectorAll('a[href^="/sheets/"]')
        assert.strictEqual(links.length, isLoggedIn && !isGamePreview ? 1 : 0)
        if (links.length) {
          assert.strictEqual(links[0].getAttribute('href'), `/sheets/game%20id/${teams[index].id}/editor`)
          assert.strictEqual(links[0].text.trim(), `Fill out ${teams[index].name} stats`)
          assert(column.toString().lastIndexOf('</table>') < column.toString().indexOf('Fill out'))
        }
      })
    }
  }
}

async function testLoginProps () {
  for (const user of [undefined, { id: 'synthetic-user' }]) {
    const responses = [
      { data: { currentGame: [game] } },
      { data: { allPlayerGameStats: [] } },
      { data: { seasonGames: [] } }
    ]
    const { getGamePageProps } = load('../app/next/lib/game-utils.js', {
      './server-graphql-client': { query: async () => responses.shift() },
      './global-server-side-props': { updateWithGlobalServerSideProps: async () => {} },
      './game-url': load('../app/next/lib/game-url.js')
    })
    const { props } = await getGamePageProps({ params: { game: game.id, slug: game.league.slug }, req: { user } })
    assert.strictEqual(props.isLoggedIn, Boolean(user))
    assert.strictEqual(props.user, undefined)
    assert.strictEqual(responses.length, 0)
  }
  console.log('Game recap links: login props, both teams, pending/existing stats, and recap/preview visibility passed')
}

testLoginProps().catch(error => {
  console.error(error)
  process.exitCode = 1
})
