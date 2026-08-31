function validateTeamOrder (teamOrder) {
  if (!Array.isArray(teamOrder) || teamOrder.length === 0) {
    throw new Error('Team order must include at least one team')
  }
}

function validatePickNumber (pickNumber) {
  if (!Number.isInteger(pickNumber) || pickNumber < 0) {
    throw new Error('Pick number must be a non-negative integer')
  }
}

function getSnakeTeamId (teamOrder, pickNumber) {
  validateTeamOrder(teamOrder)
  validatePickNumber(pickNumber)

  const roundIndex = Math.floor(pickNumber / teamOrder.length)
  const position = pickNumber % teamOrder.length
  const teamIndex = roundIndex % 2 === 0
    ? position
    : teamOrder.length - 1 - position

  return teamOrder[teamIndex]
}

function getDraftPosition (teamOrder, pickNumber, nextTeamOverrideId) {
  const suggestedTeamId = getSnakeTeamId(teamOrder, pickNumber)
  if (nextTeamOverrideId && !teamOrder.includes(nextTeamOverrideId)) {
    throw new Error('Override team must be part of the draft order')
  }

  const roundIndex = Math.floor(pickNumber / teamOrder.length)
  return {
    pickNumber,
    roundNumber: roundIndex + 1,
    direction: roundIndex % 2 === 0 ? 'forward' : 'reverse',
    suggestedTeamId,
    currentTeamId: nextTeamOverrideId || suggestedTeamId,
    isOverride: Boolean(nextTeamOverrideId && nextTeamOverrideId !== suggestedTeamId)
  }
}

function getUpcomingTeamIds (teamOrder, pickNumber, nextTeamOverrideId, count) {
  validateTeamOrder(teamOrder)
  validatePickNumber(pickNumber)
  if (!Number.isInteger(count) || count < 0) {
    throw new Error('Upcoming team count must be a non-negative integer')
  }

  const upcoming = []
  for (let offset = 0; offset < count; offset++) {
    if (offset === 0 && nextTeamOverrideId) {
      if (!teamOrder.includes(nextTeamOverrideId)) {
        throw new Error('Override team must be part of the draft order')
      }
      upcoming.push(nextTeamOverrideId)
    } else {
      upcoming.push(getSnakeTeamId(teamOrder, pickNumber + offset))
    }
  }
  return upcoming
}

function advanceDraftPosition (state, shouldAdvance) {
  validatePickNumber(state.currentPickNumber)
  return {
    currentPickNumber: shouldAdvance
      ? state.currentPickNumber + 1
      : state.currentPickNumber,
    nextTeamOverrideId: shouldAdvance ? null : state.nextTeamOverrideId || null
  }
}

module.exports = {
  getSnakeTeamId,
  getDraftPosition,
  getUpcomingTeamIds,
  advanceDraftPosition
}
