import { useEffect, useRef, useState } from 'react'
import Modal from './Modal'
import RecaptchaCheckbox from './RecaptchaCheckbox'

const STORAGE_KEY = 'sfu-donation-attempt'
const SDK_URL = 'https://js.braintreegateway.com/web/dropin/1.44.1/js/dropin.min.js'
let sdkPromise

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

export default function DonationForm () {
  const [amount, setAmount] = useState('25')
  const [from, setFrom] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [token, setToken] = useState('')
  const [captchaReset, setCaptchaReset] = useState(0)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const [review, setReview] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState(null)
  const [uncertain, setUncertain] = useState(null)
  const dropin = useRef(null)
  const locked = useRef(false)
  const statusRef = useRef(null)

  useEffect(() => {
    let active = true
    let instance
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY)
      if (saved) {
        setUncertain(JSON.parse(saved))
        locked.current = true
        return
      }
    } catch (error) {
      setError('Your browser must allow local storage to safely make a donation.')
      return
    }
    Promise.all([
      loadDropin(),
      fetch('/api/donate', { cache: 'no-store' }).then(async response => {
        const body = await response.json()
        if (!response.ok || !body.clientToken) throw new Error('Payment setup unavailable.')
        return body.clientToken
      })
    ]).then(([sdk, authorization]) => {
      if (!active) return
      sdk.create({ authorization, container: '#donation-payment' }, (error, created) => {
        if (!active) {
          if (created) created.teardown()
          return
        }
        if (error) {
          setError('Payment fields could not load. Please try again later.')
          return
        }
        instance = created
        dropin.current = created
        setReady(true)
      })
    }).catch(() => {
      if (active) setError('Donations are temporarily unavailable. Please try again later.')
    })
    return () => {
      active = false
      if (instance) Promise.resolve(instance.teardown()).catch(() => {})
      dropin.current = null
    }
  }, [])

  useEffect(() => {
    if ((result || uncertain) && statusRef.current) statusRef.current.focus()
  }, [result, uncertain])

  function openReview (event) {
    event.preventDefault()
    if (locked.current || !ready) return
    if (!/^\d+(\.\d{1,2})?$/.test(amount) || Number(amount) < 5 || Number(amount) > 250) {
      setError('Enter a donation between $5 and $250 USD, with no more than two decimal places.')
      return
    }
    if (!email.trim() || !token || from.trim().length > 100 || message.length > 1000) {
      setError('Please enter a valid email, complete verification, and check the field limits.')
      return
    }
    setError('')
    setReview({ amount: Number(amount).toFixed(2), from: from.trim() || 'Anonymous', email: email.trim(), message })
  }

  function closeReview () {
    if (!locked.current) setReview(null)
  }

  async function confirm () {
    if (locked.current || !review || !token) return
    locked.current = true
    setProcessing(true)
    setError('')
    let sent = false
    let attempt
    let timeout
    try {
      // No tokenization or payment request occurs until explicit confirmation.
      const payment = await new Promise((resolve, reject) => {
        dropin.current.requestPaymentMethod((error, payload) => error ? reject(error) : resolve(payload))
      })
      attempt = { requestId: window.crypto.randomUUID(), amount: review.amount }
      // Persist only the request identity, never donor details or payment credentials.
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(attempt))
      const controller = new window.AbortController()
      timeout = window.setTimeout(() => controller.abort(), 30000)
      sent = true
      const response = await fetch('/api/donate', {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...review, ...attempt, paymentMethodNonce: payment.nonce, recaptchaToken: token })
      })
      const body = await response.json()
      if (response.ok && body.status === 'submitted') {
        // A confirmed result resolves the persisted uncertainty guard.
        window.localStorage.removeItem(STORAGE_KEY)
        setResult(body)
        setReview(null)
      } else if (!response.ok && ['invalid', 'failed'].includes(body.status)) {
        window.localStorage.removeItem(STORAGE_KEY)
        locked.current = false
        setReview(null)
        setError(body.message || 'The donation was not completed. Please review your details before trying again.')
        dropin.current.clearSelectedPaymentMethod()
        setToken('')
        setCaptchaReset(value => value + 1)
      } else {
        const pending = { ...attempt, reference: body.reference }
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(pending))
        setUncertain(pending)
        setReview(null)
      }
    } catch (error) {
      if (sent) {
        setUncertain(attempt)
        setReview(null)
      } else {
        locked.current = false
        setError('Payment details could not be verified or saved safely. Check your payment details and browser storage settings before trying again.')
      }
    } finally {
      window.clearTimeout(timeout)
      setProcessing(false)
    }
  }

  if (uncertain) {
    return <div role="status" tabIndex="-1" ref={statusRef} className="alert alert-warning">
      <h2>Donation status needs confirmation</h2>
      <p>Please do not submit another donation. Your payment may have been processed.</p>
      <p>Contact <a href="mailto:sflultimate@gmail.com">sflultimate@gmail.com</a> with reference <strong>{uncertain.reference || uncertain.requestId}</strong> so we can check it.</p>
    </div>
  }
  if (result) {
    return <div role="status" tabIndex="-1" ref={statusRef} className="alert alert-success">
      <h2>Thank you for supporting our community!</h2>
      <p>Your ${Number(result.amount / 100).toFixed(2)} USD donation was successful. Reference: <strong>{result.reference}</strong>.</p>
      <p>{result.emailStatus === 'sent' ? 'Your confirmation email has been sent.' : 'Your payment succeeded, but your confirmation email has not been delivered yet. Please do not donate again. Contact sflultimate@gmail.com if you need a confirmation.'}</p>
    </div>
  }

  return <>
    <form onSubmit={openReview}>
      <fieldset disabled={processing}>
        <legend>Make a one-time donation</legend>
        <p id="donation-limits">$5–$250 USD. You will review your donation before any charge.</p>
        <div className="d-flex flex-wrap gap-2 mb-3" role="group" aria-label="Suggested donation amounts">
          {[10, 25, 50, 100, 250].map(value => <button key={value} type="button" className={`btn ${Number(amount) === value ? 'btn-primary' : 'btn-outline-primary'}`} aria-pressed={Number(amount) === value} onClick={() => setAmount(String(value))}>${value}</button>)}
        </div>
        <label htmlFor="donation-amount" className="form-label">Donation amount (USD), or enter a custom amount</label>
        <input id="donation-amount" className="form-control mb-3" type="number" min="5" max="250" step="0.01" required value={amount} onChange={event => setAmount(event.target.value)} aria-describedby="donation-limits" />
        <label htmlFor="donation-from" className="form-label">From (optional)</label>
        <input id="donation-from" className="form-control mb-3" maxLength={100} placeholder="Anonymous" value={from} onChange={event => setFrom(event.target.value)} />
        <label htmlFor="donation-email" className="form-label">Email (required)</label>
        <input id="donation-email" className="form-control mb-3" type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} />
        <label htmlFor="donation-message" className="form-label">Private message (optional, up to 1,000 characters)</label>
        <textarea id="donation-message" className="form-control mb-3" maxLength={1000} rows={4} value={message} onChange={event => setMessage(event.target.value)} />
        <p>Your name and message are private and visible only to the board, not published on this site. Payment details are handled securely by Braintree.</p>
        <h3>Payment details</h3>
        {!ready && <p role="status">Loading secure payment fields…</p>}
        <div id="donation-payment" />
        <RecaptchaCheckbox siteKey={process.env.NEXT_PUBLIC_RECAPTCHA_V2_SITE_KEY} resetSignal={captchaReset} onVerify={setToken} onExpired={() => setToken('')} onError={() => { setToken(''); setError('Verification is unavailable. Please try again later.') }} />
        <p className="mt-3">A confirmation email will be sent after successful payment.</p>
        <button type="submit" className="btn btn-primary btn-lg" disabled={!ready || !token}>Review donation</button>
      </fieldset>
    </form>
    {error && <div role="alert" className="alert alert-danger mt-3">{error}</div>}
    <Modal id="donation-review" isOpen={!!review} onClose={closeReview} title="Review your donation" closeDisabled={processing} footer={<>
      <button type="button" className="btn btn-secondary" disabled={processing} onClick={closeReview}>Cancel and edit</button>
      <button type="button" className="btn btn-primary" disabled={processing || !token} onClick={confirm}>{processing ? 'Processing donation…' : `Confirm and donate $${review ? review.amount : ''}`}</button>
    </>}>
      {review && <>
        <p>One-time donation: <strong>${review.amount} USD</strong></p>
        <dl><dt>From</dt><dd>{review.from}</dd><dt>Email</dt><dd>{review.email}</dd><dt>Private message</dt><dd style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{review.message || 'No message'}</dd></dl>
        <p>Only confirming below submits your payment. Your details and private message are shared only with the board.</p>
        {!token && <p role="alert">Verification expired. Cancel and complete verification again.</p>}
        {processing && <p role="status">Processing your donation. Please keep this page open.</p>}
        {error && <p role="alert">{error}</p>}
      </>}
    </Modal>
  </>
}
