import { useEffect, useRef } from 'react'

export default function ShortcodeContent ({ html, footerScripts }) {
  const contentRef = useRef(null)

  useEffect(() => {
    const scriptsToAppend = [...(footerScripts || [])]

    if (html?.includes('instagram-media')) {
      scriptsToAppend.push({ src: 'https://www.instagram.com/embed.js' })
    }

    if (html?.includes('gfm-embed')) {
      scriptsToAppend.push({ src: 'https://www.gofundme.com/static/js/embed.js', defer: true })
    }

    const appendedScripts = scriptsToAppend.map(script => {
      const scriptEl = document.createElement('script')

      if (script.src) {
        scriptEl.src = script.src
        scriptEl.defer = !!script.defer
      } else if (script.content) {
        scriptEl.text = script.content
      }

      if (script.src === 'https://www.gofundme.com/static/js/embed.js') {
        scriptEl.onload = () => {
          // GoFundMe only initializes on DOMContentLoaded, which React may have missed.
          if (document.readyState === 'loading') return
          contentRef.current?.querySelectorAll('.gfm-embed[data-url]').forEach(embed => {
            if (embed.querySelector('iframe')) return
            const iframe = document.createElement('iframe')
            const size = new URL(embed.dataset.url).pathname.split('/')[4]
            iframe.src = embed.dataset.url
            iframe.className = 'gfm-embed-iframe'
            iframe.title = 'GoFundMe fundraiser'
            iframe.width = '100%'
            iframe.height = size === 'small' ? '70' : size === 'medium' ? '200' : '500'
            iframe.frameBorder = '0'
            iframe.scrolling = 'no'
            embed.appendChild(iframe)
          })
        }
      }

      document.body.appendChild(scriptEl)
      return scriptEl
    })

    return () => appendedScripts.forEach(scriptEl => {
      scriptEl.onload = null
      scriptEl.remove()
    })
  }, [html, footerScripts])

  return <div ref={contentRef} dangerouslySetInnerHTML={{ __html: html }} />
}
