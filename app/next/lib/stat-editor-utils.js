function buildStatEditorUrl (gameId, teamId) {
  return `/sheets/${encodeURIComponent(gameId)}/${encodeURIComponent(teamId)}/editor`
}

function getTeamGameDetails (game, teamId) {
  const isHomeTeam = game.homeTeam?.id === teamId
  const isAwayTeam = game.awayTeam?.id === teamId

  if (!isHomeTeam && !isAwayTeam) {
    return null
  }

  return {
    isHomeTeam,
    team: isHomeTeam ? game.homeTeam : game.awayTeam,
    opponent: isHomeTeam ? game.awayTeam : game.homeTeam,
    teamScore: isHomeTeam ? game.homeTeamScore : game.awayTeamScore,
    opponentScore: isHomeTeam ? game.awayTeamScore : game.homeTeamScore
  }
}

function normalizeStatValue (value) {
  const number = Number(value)
  return Number.isInteger(number) && number >= 0 ? number : 0
}

function mergeSavedStat (stat, saved) {
  return {
    ...stat,
    gameStatId: saved.id,
    assists: saved.assists,
    scores: saved.scores,
    defenses: saved.defenses,
    attended: saved.attended
  }
}

function getStatTotals (stats) {
  return stats.reduce((totals, stat) => {
    totals.assists += stat.assists
    totals.scores += stat.scores
    totals.defenses += stat.defenses
    return totals
  }, { assists: 0, scores: 0, defenses: 0 })
}

function validateGameScores (teamScore, opponentScore) {
  if (teamScore === null || teamScore === '' || opponentScore === null || opponentScore === '') {
    return ['Enter both final scores before saving.']
  }

  const scores = [teamScore, opponentScore]
  if (scores.some(score => !Number.isInteger(score) || score < 0)) {
    return ['Final scores must be whole numbers of zero or more.']
  }

  return []
}

function validateTeamStats (stats, teamScore) {
  const errors = []
  const warnings = []
  const values = stats.flatMap(stat => [stat.assists, stat.scores, stat.defenses])
  const hasInvalidStat = values.some(value => !Number.isInteger(value) || value < 0)
  const hasValidTeamScore = Number.isInteger(teamScore) && teamScore >= 0
  const totals = getStatTotals(stats)

  if (hasInvalidStat) {
    errors.push('Stats must be whole numbers of zero or more.')
    return { errors, warnings, totals }
  }

  if (!hasValidTeamScore) {
    errors.push('Enter the team score before saving stats.')
  } else {
    const labels = { assists: 'assists', scores: 'scores' }
    Object.keys(labels).forEach(stat => {
      if (totals[stat] > teamScore) {
        errors.push(`Total ${labels[stat]} (${totals[stat]}) cannot exceed the team score (${teamScore}).`)
      } else if (totals[stat] < teamScore) {
        warnings.push(`Total ${labels[stat]} (${totals[stat]}) are less than the team score (${teamScore}).`)
      }
    })
  }

  return { errors, warnings, totals }
}

module.exports = {
  buildStatEditorUrl,
  getTeamGameDetails,
  mergeSavedStat,
  normalizeStatValue,
  validateGameScores,
  validateTeamStats
}
