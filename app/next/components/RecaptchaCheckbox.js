import { useEffect, useRef } from 'react'

let recaptchaScriptPromise

function waitForRecaptchaRender () {
  return new Promise((resolve, reject) => {
    const maxAttempts = 50
    let attemptCount = 0

    const checkForRender = function () {
      if (window.grecaptcha && typeof window.grecaptcha.render === 'function') {
        resolve(window.grecaptcha)
        return
      }

      attemptCount++
      if (attemptCount >= maxAttempts) {
        reject(new Error('reCAPTCHA loaded, but the checkbox API is not available.'))
        return
      }

      window.setTimeout(checkForRender, 100)
    }

    checkForRender()
  })
}

function loadRecaptchaScript () {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('reCAPTCHA requires a browser environment.'))
  }

  if (window.grecaptcha && typeof window.grecaptcha.render === 'function') {
    return Promise.resolve(window.grecaptcha)
  }

  if (!recaptchaScriptPromise) {
    recaptchaScriptPromise = new Promise((resolve, reject) => {
      const existingScript = document.querySelector('script[data-recaptcha-script="checkbox"]')
      if (existingScript) {
        existingScript.addEventListener('load', function () {
          waitForRecaptchaRender().then(resolve).catch(reject)
        })
        existingScript.addEventListener('error', function () {
          reject(new Error('Unable to load reCAPTCHA.'))
        })
        return
      }

      const script = document.createElement('script')
      script.src = 'https://www.google.com/recaptcha/api.js?render=explicit'
      script.async = true
      script.defer = true
      script.dataset.recaptchaScript = 'checkbox'
      script.onload = function () {
        waitForRecaptchaRender().then(resolve).catch(reject)
      }
      script.onerror = function () {
        reject(new Error('Unable to load reCAPTCHA.'))
      }
      document.head.appendChild(script)
    })
  }

  return recaptchaScriptPromise
}

export default function RecaptchaCheckbox ({
  siteKey,
  onVerify,
  onExpired,
  onError,
  resetSignal
}) {
  const containerRef = useRef(null)
  const widgetIdRef = useRef(null)
  const onVerifyRef = useRef(onVerify)
  const onExpiredRef = useRef(onExpired)
  const onErrorRef = useRef(onError)

  useEffect(() => {
    onVerifyRef.current = onVerify
  }, [onVerify])

  useEffect(() => {
    onExpiredRef.current = onExpired
  }, [onExpired])

  useEffect(() => {
    onErrorRef.current = onError
  }, [onError])

  useEffect(() => {
    let isActive = true

    if (!siteKey) {
      if (onErrorRef.current) {
        onErrorRef.current(new Error('Missing reCAPTCHA site key.'))
      }
      return
    }

    loadRecaptchaScript()
      .then(function (grecaptcha) {
        if (!isActive || !containerRef.current) {
          return
        }

        if (widgetIdRef.current !== null) {
          grecaptcha.reset(widgetIdRef.current)
          return
        }

        widgetIdRef.current = grecaptcha.render(containerRef.current, {
          sitekey: siteKey,
          callback: function (token) {
            if (onVerifyRef.current) {
              onVerifyRef.current(token)
            }
          },
          'expired-callback': function () {
            if (onExpiredRef.current) {
              onExpiredRef.current()
            }
          },
          'error-callback': function () {
            if (onErrorRef.current) {
              onErrorRef.current(new Error('reCAPTCHA verification failed to load.'))
            }
          }
        })
      })
      .catch(function (error) {
        if (isActive && onErrorRef.current) {
          onErrorRef.current(error)
        }
      })

    return () => {
      isActive = false
    }
  }, [siteKey])

  useEffect(() => {
    if (typeof window === 'undefined' || widgetIdRef.current === null || !window.grecaptcha) {
      return
    }

    window.grecaptcha.reset(widgetIdRef.current)
  }, [resetSignal])

  return <div ref={containerRef}></div>
}
