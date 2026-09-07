describe('Mobile game stat editor', () => {
  beforeEach(() => {
    cy.request({
      method: 'POST',
      url: '/admin/api',
      body: {
        query: `
          query {
            allGames(first: 50, sortBy: scheduledTime_DESC) {
              id
              scheduledTime
              league { slug }
              homeTeam { id players { id } }
              awayTeam { id players { id } }
            }
          }
        `
      }
    }).then(({ body }) => {
      assert.isUndefined(body.errors)
      const game = body.data.allGames.find(game => game.homeTeam?.players.length || game.awayTeam?.players.length)
      const team = game.homeTeam?.players.length ? game.homeTeam : game.awayTeam
      const date = new Date(game.scheduledTime).toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
      cy.wrap({ gameId: game.id, teamId: team.id, leagueSlug: game.league.slug, date }).as('statEditorRoute')
    })
  })

  it('renders mobile controls and prevents inconsistent stats from saving', function () {
    cy.viewport('iphone-x')
    cy.visit(`/sheets/${this.statEditorRoute.gameId}/${this.statEditorRoute.teamId}/editor`)

    cy.contains('Enter the final score').should('be.visible')
    cy.get('.mobile-stat-card').should('have.length.greaterThan', 0)
    cy.get('.mobile-stat-card input[type="number"]').its('length').then(inputCount => {
      for (let index = 0; index < inputCount; index++) {
        cy.get('.mobile-stat-card input[type="number"]').eq(index).clear()
      }
    })

    cy.get('input[id^="team-score-"]').clear()
    cy.get('input[id^="team-score-"]').type('3')
    cy.get('input[id^="opponent-score-"]').clear()
    cy.get('input[id^="opponent-score-"]').type('0')
    cy.get('.mobile-stat-card').first().within(() => {
      cy.get('[aria-label="Increase Scores"]').click()
      cy.get('[aria-label="Increase Scores"]').click()
      cy.get('[aria-label="Increase Assists"]').click()
      cy.get('[aria-label="Increase Assists"]').click()
    })

    cy.contains('Total assists (2) are less than the team score (3).').should('be.visible')
    cy.contains('Total scores (2) are less than the team score (3).').should('be.visible')

    cy.get('input[id^="team-score-"]').clear()
    cy.get('input[id^="team-score-"]').type('1')
    cy.contains('button', 'Save').click()

    cy.contains('Total assists (2) cannot exceed the team score (1).').should('be.visible')
    cy.contains('Total scores (2) cannot exceed the team score (1).').should('be.visible')
    cy.contains('Stats saved.').should('not.exist')
  })

  it('prints a QR code linking each team sheet to its editor', function () {
    cy.visit(`/leagues/${this.statEditorRoute.leagueSlug}/sheets?date=${this.statEditorRoute.date}`)

    cy.get('img[alt^="QR code to enter"]').should('have.length.greaterThan', 0)
    cy.get('img[alt^="QR code to enter"]').first().should('have.attr', 'src').and('match', /^data:image\/png;base64,/)
  })

  it('keeps player names visible after a successful save', function () {
    cy.viewport('iphone-x')
    cy.visit(`/sheets/${this.statEditorRoute.gameId}/${this.statEditorRoute.teamId}/editor`)

    cy.get('.mobile-stat-card h2').first().invoke('text').then(playerName => {
      cy.get('.stat-editor-totals span').then(totalElements => {
        const totals = [...totalElements].map(element => Number(element.textContent.match(/\d+/)[0]))
        const teamScore = Math.max(totals[0], totals[1])

        cy.get('input[id^="team-score-"]').clear()
        cy.get('input[id^="team-score-"]').type(String(teamScore))
        cy.get('input[id^="opponent-score-"]').clear()
        cy.get('input[id^="opponent-score-"]').type('0')

        cy.intercept('POST', '**/api/stats', request => {
          request.reply({
            stats: request.body.stats.map(stat => ({
              id: stat.gameStatId || `new-${stat.playerId}`,
              assists: stat.assists,
              scores: stat.scores,
              defenses: stat.defenses,
              attended: stat.attended,
              player: { id: stat.playerId }
            }))
          })
        })

        cy.contains('button', 'Save').click()
        cy.contains('Stats saved.').should('be.visible')
        cy.get('.mobile-stat-card h2').first().should('have.text', playerName)
      })
    })
  })
})
