const PREFERRED_POSITION_CONFIG = {
  cutter: {
    label: 'Cutter',
    icon: 'fa-solid fa-person-running'
  },
  defense: {
    label: 'Defense',
    icon: 'fa-solid fa-shield-halved'
  },
  handler: {
    label: 'Handler',
    icon: 'fa-solid fa-hand'
  },
  hybrid: {
    label: 'Hybrid',
    icon: 'fa-solid fa-arrows-left-right'
  }
}

function normalizePreferredPosition (position = '') {
  return position.trim().toLowerCase()
}

export function getPreferredPositions (preferredPositions) {
  if (Array.isArray(preferredPositions)) {
    return preferredPositions
      .map(normalizePreferredPosition)
      .filter(Boolean)
  }

  if (typeof preferredPositions === 'string') {
    return preferredPositions
      .split(',')
      .map(normalizePreferredPosition)
      .filter(Boolean)
  }

  return []
}

export function buildPreferredPositionMap (players = []) {
  return players.reduce(function (acc, player) {
    getPreferredPositions(player?.preferredPositions).forEach(function (position) {
      acc[position] = acc[position] || 0
      acc[position]++
    })
    return acc
  }, {})
}

function getPreferredPositionConfig (position) {
  const normalizedPosition = normalizePreferredPosition(position)
  const configuredPosition = PREFERRED_POSITION_CONFIG[normalizedPosition]

  if (configuredPosition) {
    return configuredPosition
  }

  return {
    label: normalizedPosition.charAt(0).toUpperCase() + normalizedPosition.slice(1),
    icon: 'fa-solid fa-circle'
  }
}

export function PreferredPositionBadge (props) {
  const { position, count } = props
  const config = getPreferredPositionConfig(position)

  return (
    <span
      className="badge rounded-pill text-bg-primary fs-6 px-3 py-2 d-inline-flex align-items-center gap-2"
      style={{ fontWeight: 600 }}
    >
      <i className={`fa ${config.icon}`} aria-hidden="true"></i>
      <span>{config.label}</span>
      {
        typeof count === 'number' && (
          <span className="ms-1 opacity-75">{count}</span>
        )
      }
    </span>
  )
}
