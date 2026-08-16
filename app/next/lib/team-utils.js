export function slugifyTeamName (value = '') {
  const normalizedValue = String(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return normalizedValue || 'team'
}

export function getTeamSlug (team = {}) {
  return team.slug || slugifyTeamName(team.name)
}

export function buildTeamUrl (league, team) {
  return `/leagues/${league.slug}/teams/${getTeamSlug(team)}`
}

export function isMatchingTeamRoute (team = {}, routeSlug = '') {
  const normalizedRouteSlug = String(routeSlug).trim().toLowerCase()
  return getTeamSlug(team).toLowerCase() === normalizedRouteSlug
}
