function escapeHtml (value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[character]))
}

function paragraphHtml (value) {
  return `<p style="margin: 0 0 16px; color: #2d2d2d; font-size: 16px;">${escapeHtml(value).replace(/\n/g, '<br>')}</p>`
}

function rowHtml (row, index, last) {
  const background = index % 2 === 0 ? ' background-color: #f8f5f9;' : ''
  const border = last ? '' : ' border-bottom: 1px solid #e8e3ea;'
  const labelWidth = index === 0 ? ' width: 45%;' : ''
  return `<tr style="${background.trim()}"><td style="${labelWidth} padding: 11px 14px;${border} color: #666666; font-weight: bold;">${escapeHtml(row.label)}</td><td style="padding: 11px 14px;${border}">${escapeHtml(row.value)}</td></tr>`
}

function buildBrandedEmail ({
  badge,
  heading,
  intro,
  introHtml,
  highlight,
  rows = [],
  paragraphs = []
} = {}) {
  const introText = intro || ''
  const body = []

  if (badge || heading || intro || introHtml) {
    body.push('<div style="margin-bottom: 24px; text-align: center;">')
    if (badge) {
      body.push(`<div style="display: inline-block; margin-bottom: 12px; padding: 6px 12px; border-radius: 999px; background-color: #eaf7ee; color: #237a3b; font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">${escapeHtml(badge)}</div>`)
    }
    if (heading) {
      body.push(`<h1 style="margin: 0 0 8px; color: #2d2d2d; font-size: 26px; line-height: 1.25;">${escapeHtml(heading)}</h1>`)
    }
    if (introHtml) {
      body.push(`<p style="margin: 0; color: #666666; font-size: 16px;">${introHtml}</p>`)
    } else if (intro) {
      body.push(`<p style="margin: 0; color: #666666; font-size: 16px;">${escapeHtml(intro)}</p>`)
    }
    body.push('</div>')
  }

  if (highlight && highlight.value) {
    body.push(`<div style="margin-bottom: 24px; padding: 18px 20px; border-radius: 8px; background-color: #f8f5f9; border-left: 4px solid #804399;">
                    <p style="margin: 0 0 4px; color: #666666; font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">${escapeHtml(highlight.label || '')}</p>
                    <p style="margin: 0; color: #804399; font-size: 28px; font-weight: bold;">${escapeHtml(highlight.value)}</p>
                  </div>`)
  }

  if (rows.length) {
    body.push('<h2 style="margin: 0 0 12px; color: #2d2d2d; font-size: 19px;">Order summary</h2>')
    body.push('<table role="presentation" style="width: 100%; border: 1px solid #e3dee5; border-collapse: separate; border-spacing: 0; border-radius: 8px; overflow: hidden; font-size: 14px;"><tbody>')
    rows.forEach((row, index) => {
      body.push(rowHtml(row, index, index === rows.length - 1))
    })
    body.push('</tbody></table>')
  }

  if (paragraphs.length) {
    body.push(`<div style="margin-top: ${rows.length || highlight ? '24px' : '0'};">`)
    paragraphs.forEach(paragraph => body.push(paragraphHtml(paragraph)))
    body.push('</div>')
  }

  const html = `
            <div style="margin: 0; padding: 32px 12px; background-color: #f4f2f5; color: #2d2d2d; font-family: Arial, Helvetica, sans-serif; line-height: 1.5;">
              <div style="max-width: 600px; margin: 0 auto; overflow: hidden; background-color: #ffffff; border: 1px solid #e3dee5; border-radius: 12px; box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);">
                <div style="padding: 24px; text-align: center; background-color: #ffffff; border-bottom: 4px solid #804399;">
                  <img src="https://www.sflultimate.com/images/sflultimate-logo-pink-flamingo.png" alt="South Florida Ultimate" style="display: block; width: 220px; max-width: 100%; height: auto; margin: 0 auto;" />
                </div>
                <div style="padding: 32px 28px;">
                  ${body.join('\n')}
                </div>

                <div style="padding: 24px; text-align: center; background-color: #302d31; color: #ffffff;">
                  <p style="margin: 0 0 12px; font-size: 16px;"><strong>Stay connected with South Florida Ultimate</strong></p>
                  <p style="margin: 0 0 16px; line-height: 2;">
                    <a href="https://www.instagram.com/sflultimate/" style="margin: 0 7px; color: #ffffff; font-weight: bold; text-decoration: none;">Instagram</a>
                    <a href="https://www.facebook.com/sflultimate/" style="margin: 0 7px; color: #ffffff; font-weight: bold; text-decoration: none;">Facebook</a>
                    <a href="https://www.tiktok.com/@sflultimate" style="margin: 0 7px; color: #ffffff; font-weight: bold; text-decoration: none;">TikTok</a>
                    <a href="https://www.youtube.com/sflultimate/" style="margin: 0 7px; color: #ffffff; font-weight: bold; text-decoration: none;">YouTube</a>
                    <a href="https://chat.whatsapp.com/FZC77g5Tzsw8xwxMXG997V" style="margin: 0 7px; color: #ffffff; font-weight: bold; text-decoration: none;">WhatsApp</a>
                  </p>
                  <p style="margin: 0; color: #c8c3ca; font-size: 12px;">
                    Organized by South Florida Ultimate Inc., a local non-for-profit and social recreational club organized for the exclusive purposes of <strong>playing</strong>, <strong>promoting</strong>, and <strong>enjoying</strong> the sport known as Ultimate or Ultimate Frisbee.
                  </p>
                  <p style="margin: 6px 0 0; color: #c8c3ca; font-size: 12px;">sflultimate.com</p>
                </div>
              </div>
            </div>
          `

  const textParts = []
  if (heading) textParts.push(heading)
  if (introText) textParts.push(introText)
  if (highlight && highlight.value) {
    textParts.push(highlight.label ? `${highlight.label}: ${highlight.value}` : String(highlight.value))
  }
  rows.forEach(row => textParts.push(`${row.label}: ${row.value}`))
  paragraphs.forEach(paragraph => textParts.push(paragraph))
  const text = textParts.join('\n\n')

  return { html, text }
}

module.exports = {
  escapeHtml,
  buildBrandedEmail
}
