import { useEffect } from 'react'

export default function ShortcodeContent ({ html, footerScripts }) {
  useEffect(() => {
    const appendedScripts = (footerScripts || []).map(script => {
      const scriptEl = document.createElement('script')

      if (script.src) {
        scriptEl.src = script.src
      } else if (script.content) {
        scriptEl.text = script.content
      }

      document.body.appendChild(scriptEl)
      return scriptEl
    })

    return () => appendedScripts.forEach(scriptEl => scriptEl.remove())
  }, [html, footerScripts])

  return <div dangerouslySetInnerHTML={{ __html: html }} />
}
