export default function fireConfetti () {
  if (typeof window === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return
  }

  const colors = ['#804399', '#e83e8c', '#ffc107', '#28a745', '#17a2b8', '#ffffff']
  const container = document.createElement('div')
  container.setAttribute('aria-hidden', 'true')
  Object.assign(container.style, {
    position: 'fixed',
    inset: '0',
    overflow: 'hidden',
    pointerEvents: 'none',
    zIndex: '10000'
  })
  document.body.appendChild(container)

  for (let i = 0; i < 150; i++) {
    const piece = document.createElement('span')
    const fromLeft = i % 2 === 0
    const size = 6 + Math.random() * 8
    const originY = 65 + Math.random() * 25
    const travelX = window.innerWidth * (0.35 + Math.random() * 0.3) * (fromLeft ? 1 : -1)
    const rise = window.innerHeight * (0.35 + Math.random() * 0.35)
    const fall = window.innerHeight * (0.12 + Math.random() * 0.16)
    const rotation = 360 + Math.random() * 720

    Object.assign(piece.style, {
      position: 'absolute',
      left: fromLeft ? '-10px' : 'calc(100% + 10px)',
      top: `${originY}%`,
      width: `${size}px`,
      height: `${size * 0.55}px`,
      borderRadius: '2px',
      backgroundColor: colors[i % colors.length]
    })
    container.appendChild(piece)

    piece.animate([
      { transform: 'translate(0, 0) rotate(0deg)', opacity: 1 },
      { transform: `translate(${travelX}px, -${rise}px) rotate(${rotation * 0.7}deg)`, opacity: 1, offset: 0.68 },
      { transform: `translate(${travelX * 1.05}px, ${-rise + fall}px) rotate(${rotation}deg)`, opacity: 0 }
    ], {
      duration: 1600 + Math.random() * 700,
      delay: Math.random() * 180,
      easing: 'cubic-bezier(0.15, 0.75, 0.35, 1)',
      fill: 'forwards'
    })
  }

  window.setTimeout(() => container.remove(), 2700)
}
