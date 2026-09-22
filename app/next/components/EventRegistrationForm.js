import { useEffect, useRef, useState } from 'react'
import Modal from './Modal'

const SDK_URL = 'https://js.braintreegateway.com/web/dropin/1.44.1/js/dropin.min.js'
const RECAPTCHA_V3_SITE_KEY = '6Ld6rNQUAAAAAAthlbLL1eCF9NGKfP8-mQOHu89w'
let sdkPromise
let recaptchaPromise

function loadDropin () {
  if (window.braintree && window.braintree.dropin) return Promise.resolve(window.braintree.dropin)
  if (!sdkPromise) {
    sdkPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = SDK_URL
      script.async = true
      script.onload = () => {
        if (window.braintree && window.braintree.dropin) resolve(window.braintree.dropin)
        else reject(new Error('Payment fields unavailable.'))
      }
      script.onerror = () => reject(new Error('Payment fields unavailable.'))
      document.head.appendChild(script)
    })
  }
  return sdkPromise
}

function loadRecaptchaV3 () {
  if (window.grecaptcha && typeof window.grecaptcha.execute === 'function') {
    return Promise.resolve(window.grecaptcha)
  }
  if (!recaptchaPromise) {
    recaptchaPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_V3_SITE_KEY}`
      script.async = true
      script.onload = () => {
        if (!window.grecaptcha) {
          reject(new Error('Verification is unavailable. Please try again later.'))
          return
        }
        window.grecaptcha.ready(() => resolve(window.grecaptcha))
      }
      script.onerror = () => reject(new Error('Verification is unavailable. Please try again later.'))
      document.head.appendChild(script)
    })
  }
  return recaptchaPromise
}

function executeCaptcha () {
  return loadRecaptchaV3().then(grecaptcha => grecaptcha.execute(RECAPTCHA_V3_SITE_KEY, { action: 'event_registration' }))
}

function storageKey (eventId) {
  return `sfu-event-registration-${eventId}`
}

export default function EventRegistrationForm ({ eventId, eventName, price }) {
  const amountPaid = Number.isInteger(price) && price > 0 ? price : 0
  const paid = amountPaid > 0
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [streetAddress, setStreetAddress] = useState('')
  const [comments, setComments] = useState('')
  const [ready, setReady] = useState(!paid)
  const [error, setError] = useState('')
  const [review, setReview] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState(null)
  const [uncertain, setUncertain] = useState(null)
  const dropin = useRef(null)
  const locked = useRef(false)
  const statusRef = useRef(null)

  useEffect(() => {
    loadRecaptchaV3().catch(() => {})
  }, [])

  useEffect(() => {
    let active = true
    let instance
    try {
      const saved = window.localStorage.getItem(storageKey(eventId))
      if (saved) {
        setUncertain(JSON.parse(saved))
        locked.current = true
        return
      }
    } catch {
      setError('Your browser must allow local storage to safely register.')
      return
    }
    if (!paid) return
    Promise.all([
      loadDropin(),
      fetch('/api/event-registration', { cache: 'no-store' }).then(async response => {
        const body = await response.json()
        if (!response.ok || !body.clientToken) throw new Error('Payment setup unavailable.')
        return body.clientToken
      })
    ]).then(([sdk, authorization]) => {
      if (!active) return
      sdk.create({ authorization, container: '#event-registration-payment' }, (createError, created) => {
        if (!active) {
          if (created) created.teardown()
          return
        }
        if (createError) {
          setError('Payment fields could not load. Please try again later.')
          return
        }
        instance = created
        dropin.current = created
        setReady(true)
      })
    }).catch(() => {
      if (active) setError('Registration payment is temporarily unavailable. Please try again later.')
    })
    return () => {
      active = false
      if (instance) Promise.resolve(instance.teardown()).catch(() => {})
      dropin.current = null
    }
  }, [eventId, paid])

  useEffect(() => {
    if ((result || uncertain) && statusRef.current) statusRef.current.focus()
  }, [result, uncertain])

  function openReview (event) {
    event.preventDefault()
    if (locked.current || !ready) return
    if (!name.trim() || !email.trim() || name.trim().length > 100 || comments.length > 1000) {
      setError('Please enter your name and a valid email, and check the field limits.')
      return
    }
    if (paid && !streetAddress.trim()) {
      setError('Please enter your street address before submitting payment.')
      return
    }
    setError('')
    setReview({ name: name.trim(), email: email.trim(), comments, amountPaid, streetAddress: paid ? streetAddress.trim() : '' })
  }

  function closeReview () {
    if (!locked.current) setReview(null)
  }

  async function confirm () {
    if (locked.current || !review) return
    locked.current = true
    setProcessing(true)
    setError('')
    let sent = false
    let attempt
    let timeout
    try {
      const recaptchaToken = await executeCaptcha()
      let paymentMethodNonce = ''
      if (paid) {
        const payment = await new Promise((resolve, reject) => {
          dropin.current.requestPaymentMethod((paymentError, payload) => paymentError ? reject(paymentError) : resolve(payload))
        })
        paymentMethodNonce = payment.nonce
      }
      attempt = { requestId: window.crypto.randomUUID(), eventId }
      window.localStorage.setItem(storageKey(eventId), JSON.stringify(attempt))
      const controller = new window.AbortController()
      timeout = window.setTimeout(() => controller.abort(), 30000)
      sent = true
      const response = await fetch('/api/event-registration', {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...review, ...attempt, paymentMethodNonce, recaptchaToken })
      })
      const body = await response.json()
      if (response.ok && body.status === 'submitted') {
        window.localStorage.removeItem(storageKey(eventId))
        setResult(body)
        setReview(null)
      } else if (!response.ok && ['invalid', 'failed'].includes(body.status)) {
        window.localStorage.removeItem(storageKey(eventId))
        locked.current = false
        setReview(null)
        setError(body.message || 'Registration was not completed. Please review your details before trying again.')
        if (dropin.current) dropin.current.clearSelectedPaymentMethod()
      } else {
        const pending = { ...attempt, reference: body.reference }
        window.localStorage.setItem(storageKey(eventId), JSON.stringify(pending))
        setUncertain(pending)
        setReview(null)
      }
    } catch {
      if (sent) {
        setUncertain(attempt)
        setReview(null)
      } else {
        locked.current = false
        setError(paid
          ? 'Payment details could not be verified or saved safely. Check your payment details and browser storage settings before trying again.'
          : 'Registration could not be submitted. Please try again.')
      }
    } finally {
      window.clearTimeout(timeout)
      setProcessing(false)
    }
  }

  if (uncertain) {
    return <div role="status" tabIndex="-1" ref={statusRef} className="alert alert-warning">
      <h2>Registration status needs confirmation</h2>
      <p>Please do not submit another registration{paid ? ' or payment' : ''}. Your request may have been processed.</p>
      <p>Contact <a href="mailto:sflultimate@gmail.com">sflultimate@gmail.com</a> with reference <strong>{uncertain.reference || uncertain.requestId}</strong> so we can check it.</p>
    </div>
  }
  if (result) {
    return <div role="status" tabIndex="-1" ref={statusRef} className="alert alert-success">
      <h2>You are registered{eventName ? ` for ${eventName}` : ''}!</h2>
      <p>{result.amountPaid > 0
        ? `Your $${Number(result.amountPaid).toFixed(2)} USD payment was successful.`
        : 'Your registration was received.'} Reference: <strong>{result.reference}</strong>.</p>
      <p>{result.emailStatus === 'sent'
        ? 'Your confirmation email has been sent.'
        : 'Your payment succeeded, but your confirmation email has not been delivered yet. Please do not register again. Contact sflultimate@gmail.com if you need a confirmation.'}</p>
    </div>
  }

  return <>
    <form onSubmit={openReview}>
      <fieldset disabled={processing}>
        <legend>Register{eventName ? ` for ${eventName}` : ''}</legend>
        <p>{paid
          ? `Registration is $${amountPaid} USD. You will review your details before any charge.`
          : 'This event is free to register.'}</p>
        <label htmlFor="event-registration-name" className="form-label">Name (required)</label>
        <input id="event-registration-name" className="form-control mb-3" autoComplete="name" required maxLength={100} value={name} onChange={event => setName(event.target.value)} />
        <label htmlFor="event-registration-email" className="form-label">Email (required)</label>
        <input id="event-registration-email" className="form-control mb-3" type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} />
        {paid && <>
          <label htmlFor="event-registration-street-address" className="form-label">Street address (required)</label>
          <input id="event-registration-street-address" className="form-control mb-3" autoComplete="address-line1" required maxLength={255} value={streetAddress} onChange={event => setStreetAddress(event.target.value)} aria-describedby="event-registration-street-address-help" />
          <p id="event-registration-street-address-help" className="form-text mt-n2 mb-3">Required for payment. Enter just your street address (for example, 12345 Palm Tree Ave.), without city, ZIP code or apartment number. We do not store this information, but send it to the payment processor for fraud prevention.</p>
        </>}
        <label htmlFor="event-registration-comments" className="form-label">Comments (optional, up to 1,000 characters)</label>
        <textarea id="event-registration-comments" className="form-control mb-3" maxLength={1000} rows={4} value={comments} onChange={event => setComments(event.target.value)} />
        {paid && <>
          <p>Payment details are handled securely by Braintree.</p>
          <h3>Payment details</h3>
          {!ready && <p role="status">Loading secure payment fields…</p>}
          <div id="event-registration-payment" />
        </>}
        <button type="submit" className="btn btn-primary btn-lg mt-3" disabled={!ready}>Review registration</button>
      </fieldset>
    </form>
    {error && <div role="alert" className="alert alert-danger mt-3">{error}</div>}
    <Modal id="event-registration-review" isOpen={!!review} onClose={closeReview} title="Review your registration" closeDisabled={processing} footer={<>
      <button type="button" className="btn btn-secondary" disabled={processing} onClick={closeReview}>Cancel and edit</button>
      <button type="button" className="btn btn-primary" disabled={processing} onClick={confirm}>{processing ? 'Submitting…' : (paid ? `Confirm and pay $${review ? Number(review.amountPaid).toFixed(2) : ''}` : 'Confirm registration')}</button>
    </>}>
      {review && <>
        {paid && <p>Registration: <strong>${Number(review.amountPaid).toFixed(2)} USD</strong></p>}
        <dl><dt>Name</dt><dd>{review.name}</dd><dt>Email</dt><dd>{review.email}</dd>{paid && <><dt>Street address</dt><dd>{review.streetAddress}</dd></>}<dt>Comments</dt><dd style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{review.comments || 'None'}</dd></dl>
        <p>{paid ? 'Only confirming below submits your payment.' : 'Only confirming below submits your registration.'}</p>
        {processing && <p role="status">Submitting. Please keep this page open.</p>}
        {error && <p role="alert">{error}</p>}
      </>}
    </Modal>
  </>
}
