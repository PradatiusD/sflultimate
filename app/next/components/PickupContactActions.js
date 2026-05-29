import { useEffect, useMemo, useRef, useState } from 'react'
import Modal from './Modal'
import RecaptchaCheckbox from './RecaptchaCheckbox'

const RECAPTCHA_V2_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_V2_SITE_KEY

const CONTACT_TYPE_CONFIG = {
  whatsapp: {
    icon: 'fa-whatsapp',
    actionButtonLabel: 'Join WhatsApp Group',
    modalTitle: 'Verify Before Opening WhatsApp',
    revealButtonLabel: 'Open WhatsApp Group'
  },
  email: {
    icon: 'fa-envelope',
    actionButtonLabel: 'Send Email',
    modalTitle: 'Verify Before Revealing Email',
    revealButtonLabel: 'Open Email App'
  },
  phone: {
    icon: 'fa-phone',
    actionButtonLabel: 'Text Phone',
    modalTitle: 'Verify Before Revealing Phone Number',
    revealButtonLabel: 'Text Organizer'
  }
}

const WEBSITE_ACTION = {
  icon: 'fa-globe',
  label: 'View Website'
}

const MAP_ACTION = {
  icon: 'fa-map-marker',
  label: 'View on Map'
}

function getPickupMapUrl (pickup) {
  if (!pickup.location) {
    return null
  }

  const address = [
    pickup.location.addressStreet,
    pickup.location.addressCity,
    pickup.location.addressState,
    pickup.location.addressZipCode
  ].filter(Boolean).join(' ')

  return `https://www.google.com/maps/place/${encodeURIComponent(address)}`
}

export default function PickupContactActions ({ pickup, className = 'btn btn-sm btn-outline-primary' }) {
  const [activeContactType, setActiveContactType] = useState(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [revealedContact, setRevealedContact] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [recaptchaToken, setRecaptchaToken] = useState('')
  const [recaptchaResetCounter, setRecaptchaResetCounter] = useState(0)
  const revealedActionRef = useRef(null)

  const modalContent = useMemo(() => {
    if (!activeContactType) {
      return null
    }

    return CONTACT_TYPE_CONFIG[activeContactType]
  }, [activeContactType])

  const mapUrl = useMemo(() => getPickupMapUrl(pickup), [pickup])

  useEffect(() => {
    if (revealedContact && revealedActionRef.current) {
      revealedActionRef.current.focus()
    }
  }, [revealedContact])

  function openModal (contactType) {
    setActiveContactType(contactType)
    setIsVerifying(false)
    setRevealedContact(null)
    setErrorMessage('')
    setRecaptchaToken('')
    setRecaptchaResetCounter((value) => value + 1)
  }

  function closeModal () {
    setActiveContactType(null)
    setIsVerifying(false)
    setRevealedContact(null)
    setErrorMessage('')
    setRecaptchaToken('')
    setRecaptchaResetCounter((value) => value + 1)
  }

  async function verifyAndRevealContact () {
    try {
      setIsVerifying(true)
      setErrorMessage('')

      const response = await fetch('/api/pickups/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          pickupId: pickup.id,
          contactType: activeContactType,
          recaptchaToken
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Unable to reveal this contact method right now.')
      }

      setRevealedContact(data)
      setRecaptchaToken('')
    } catch (error) {
      setErrorMessage(error.message || 'Unable to reveal this contact method right now.')
      setRecaptchaToken('')
      setRecaptchaResetCounter((value) => value + 1)
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <>
      <div className="d-flex flex-wrap">
        {pickup.hasContactWhatsapp && (
          <button type="button" className={`${className} me-2 mb-2`} onClick={() => openModal('whatsapp')}>
            <i className={`fa ${CONTACT_TYPE_CONFIG.whatsapp.icon} me-2`} aria-hidden="true"></i>
            {CONTACT_TYPE_CONFIG.whatsapp.actionButtonLabel}
          </button>
        )}
        {pickup.contactUrl && (
          <a className={`${className} me-2 mb-2`} href={pickup.contactUrl} target="_blank" rel="noopener noreferrer">
            <i className={`fa ${WEBSITE_ACTION.icon} me-2`} aria-hidden="true"></i>
            {WEBSITE_ACTION.label}
          </a>
        )}
        {pickup.hasContactEmail && (
          <button type="button" className={`${className} me-2 mb-2`} onClick={() => openModal('email')}>
            <i className={`fa ${CONTACT_TYPE_CONFIG.email.icon} me-2`} aria-hidden="true"></i>
            {CONTACT_TYPE_CONFIG.email.actionButtonLabel}
          </button>
        )}
        {pickup.hasContactPhone && (
          <button type="button" className={`${className} me-2 mb-2`} onClick={() => openModal('phone')}>
            <i className={`fa ${CONTACT_TYPE_CONFIG.phone.icon} me-2`} aria-hidden="true"></i>
            {CONTACT_TYPE_CONFIG.phone.actionButtonLabel}
          </button>
        )}
        {mapUrl && (
          <a className={`${className} me-2 mb-2`} href={mapUrl} target="_blank" rel="noopener noreferrer">
            <i className={`fa ${MAP_ACTION.icon} me-2`} aria-hidden="true"></i>
            {MAP_ACTION.label}
          </a>
        )}
      </div>

      <Modal
        id={`pickup-contact-modal-${pickup.id}`}
        isOpen={Boolean(activeContactType && modalContent)}
        onClose={closeModal}
        title={modalContent ? modalContent.modalTitle : ''}
        footer={(
          <>
            <button type="button" className="btn btn-secondary" onClick={closeModal}>
              Close
            </button>
            {
              revealedContact
                ? (
                  <a
                    ref={revealedActionRef}
                    className="btn btn-primary"
                    href={revealedContact.href}
                    target={revealedContact.target || '_self'}
                    rel={revealedContact.target === '_blank' ? 'noopener noreferrer' : undefined}
                  >
                    {modalContent ? modalContent.revealButtonLabel : 'Continue'}
                  </a>
                  )
                : (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={verifyAndRevealContact}
                    disabled={isVerifying || !recaptchaToken || !RECAPTCHA_V2_SITE_KEY}
                  >
                    {isVerifying ? 'Verifying...' : 'Reveal Contact Info'}
                  </button>
                  )
            }
          </>
        )}
      >
        <p className="mb-3">
          To access <strong>{pickup.title} {activeContactType} information</strong>, we now protect pickup organizer contact details behind reCAPTCHA because spammers
          have been scraping these pages, then sending unwanted calls, texts, emails, and spamming WhatsApp groups.
        </p>
        <p className="mb-3">
          We know it's a hassle, but please complete the verification step below and we will reveal this contact method for legitimate players while
          keeping it harder for bots and crawlers to harvest organizer details.
        </p>

        {!RECAPTCHA_V2_SITE_KEY && (
          <div className="alert alert-danger" role="alert">
            This verification flow is not configured yet. Add `NEXT_PUBLIC_RECAPTCHA_V2_SITE_KEY` to enable it.
          </div>
        )}

        {!revealedContact && RECAPTCHA_V2_SITE_KEY && (
          <div className="mb-3">
            <p className="small text-muted mb-2">Please complete the visible reCAPTCHA challenge so we know a real person is requesting this contact info.</p>
            <RecaptchaCheckbox
              siteKey={RECAPTCHA_V2_SITE_KEY}
              resetSignal={recaptchaResetCounter}
              onVerify={(token) => {
                setRecaptchaToken(token)
                setErrorMessage('')
              }}
              onExpired={() => {
                setRecaptchaToken('')
                setErrorMessage('reCAPTCHA expired. Please verify again.')
              }}
              onError={(error) => {
                setRecaptchaToken('')
                setErrorMessage(error.message || 'Unable to load reCAPTCHA.')
              }}
            />
          </div>
        )}

        {errorMessage && (
          <div className="alert alert-danger" role="alert">
            {errorMessage}
          </div>
        )}

        {revealedContact && (
          <div className="alert alert-success mb-0" role="alert">
            <strong>Verified.</strong> {revealedContact.value}
          </div>
        )}
      </Modal>
    </>
  )
}
