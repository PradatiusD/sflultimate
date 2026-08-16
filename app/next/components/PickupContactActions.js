import { useEffect, useMemo, useRef, useState } from 'react'
import Modal from './Modal'
import RecaptchaCheckbox from './RecaptchaCheckbox'
import { QUIZ_RULES, getQuestionsForRule, getRandomRule } from '../lib/quiz-utils'

const RECAPTCHA_V2_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_V2_SITE_KEY
const REQUIRED_CORRECT_ANSWERS = 3

const CONTACT_TYPE_CONFIG = {
  whatsapp: {
    icon: 'fa-brands fa-whatsapp',
    actionButtonLabel: 'Join WhatsApp Group',
    modalTitle: 'Verify Before Opening WhatsApp',
    revealButtonLabel: 'Open WhatsApp Group'
  },
  email: {
    icon: 'fa-solid fa-envelope',
    actionButtonLabel: 'Send Email',
    modalTitle: 'Verify Before Revealing Email',
    revealButtonLabel: 'Open Email App'
  },
  phone: {
    icon: 'fa-solid fa-phone',
    actionButtonLabel: 'Text Phone',
    modalTitle: 'Verify Before Revealing Phone Number',
    revealButtonLabel: 'Text Organizer'
  }
}

const WEBSITE_ACTION = {
  icon: 'fa-solid fa-globe',
  label: 'View Website'
}

const MAP_ACTION = {
  icon: 'fa-solid fa-location-dot',
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

function createQuizState (completedQuestionIds = [], correctAnswerCount = 0) {
  const activeRule = getRandomRule(QUIZ_RULES, completedQuestionIds)

  return {
    activeRule,
    answerState: null,
    correctAnswerCount,
    completedQuestionIds,
    questions: getQuestionsForRule(activeRule),
    selectedAnswerId: null
  }
}

export default function PickupContactActions ({ pickup, className = 'btn btn-sm btn-outline-primary' }) {
  const [activeContactType, setActiveContactType] = useState(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [revealedContact, setRevealedContact] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [recaptchaToken, setRecaptchaToken] = useState('')
  const [recaptchaResetCounter, setRecaptchaResetCounter] = useState(0)
  const [quizState, setQuizState] = useState(() => createQuizState())
  const revealedActionRef = useRef(null)

  const modalContent = useMemo(() => {
    if (!activeContactType) {
      return null
    }

    return CONTACT_TYPE_CONFIG[activeContactType]
  }, [activeContactType])

  const mapUrl = useMemo(() => getPickupMapUrl(pickup), [pickup])
  const hasPassedQuiz = quizState.correctAnswerCount >= REQUIRED_CORRECT_ANSWERS

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
    setQuizState(createQuizState())
  }

  function closeModal () {
    setActiveContactType(null)
    setIsVerifying(false)
    setRevealedContact(null)
    setErrorMessage('')
    setRecaptchaToken('')
    setRecaptchaResetCounter((value) => value + 1)
    setQuizState(createQuizState())
  }

  function answerQuizQuestion (ruleId) {
    setQuizState((currentState) => {
      if (!currentState.activeRule || currentState.answerState) {
        return currentState
      }

      const isCorrect = ruleId === currentState.activeRule.id

      return {
        ...currentState,
        answerState: isCorrect ? 'correct' : 'incorrect',
        correctAnswerCount: isCorrect ? currentState.correctAnswerCount + 1 : currentState.correctAnswerCount,
        selectedAnswerId: ruleId
      }
    })
  }

  function advanceQuizQuestion () {
    setQuizState((currentState) => {
      const completedQuestionIds = currentState.answerState === 'correct'
        ? currentState.completedQuestionIds.concat(currentState.activeRule.id)
        : currentState.completedQuestionIds

      return createQuizState(completedQuestionIds, currentState.correctAnswerCount)
    })
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
        bodyClassName={'pickup-contact-modal-body'}
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
                    disabled={isVerifying || !recaptchaToken || !RECAPTCHA_V2_SITE_KEY || !hasPassedQuiz}
                  >
                    {isVerifying ? 'Verifying...' : 'Reveal Contact Info'}
                  </button>
                  )
            }
          </>
        )}
      >
        <div className="pickup-contact-modal-body">
          <p className="mb-3">
            To access <strong>{pickup.title} {activeContactType} information</strong>, this information is behind reCAPTCHA and a fun frisbee signals quiz because spammers
            have been scraping these pages, then sending unwanted calls, texts, emails, and spamming WhatsApp groups.
          </p>
          <p className="mb-3">
            To bypass this, we're asking you to look up <a target="_blank" href="https://wfdf.sport/wp-content/uploads/2020/11/wfdf_rules_of_ultimate_-_hand_signals_feb2020.pdf">The World Flying Disc Federation</a> hand signals and answer a few questions to prove you're a real person.
          </p>

          {!revealedContact && quizState.activeRule && (
            <div className="mb-4">
              <p className="mb-2">
                First, answer <strong>{REQUIRED_CORRECT_ANSWERS}</strong> hand signal questions correctly. Progress:{' '}
                <strong>{quizState.correctAnswerCount}/{REQUIRED_CORRECT_ANSWERS}</strong>
              </p>
              <img
                src={`https://d137pw2ndt5u9c.cloudfront.net/quiz/hand-signals-${quizState.activeRule.id}.svg`}
                alt={quizState.activeRule.title}
                className="img-fluid mb-3"
                style={{
                  height: '200px',
                  width: '200px',
                  objectFit: 'contain',
                  margin: '0 auto',
                  display: 'block'
                }}
              />
              <p className="mb-2">Which hand signal is shown here?</p>
              <ul className="list-group mb-3">
                {quizState.questions.map((item, index) => {
                  const isCorrectAnswer = item.id === quizState.activeRule.id
                  const wasSelected = item.id === quizState.selectedAnswerId
                  const itemClassName = [
                    'list-group-item',
                    quizState.answerState === 'correct' && isCorrectAnswer ? 'list-group-item-success' : '',
                    quizState.answerState === 'incorrect' && wasSelected ? 'list-group-item-danger' : ''
                  ].filter(Boolean).join(' ')

                  return (
                    <li
                      key={item.id}
                      className={itemClassName}
                      style={{
                        cursor: quizState.answerState ? 'default' : 'pointer'
                      }}
                      onClick={() => answerQuizQuestion(item.id)}
                    >
                      {index + 1}. {item.title} {item.title !== item.subtitle ? item.subtitle : ''}
                    </li>
                  )
                })}
              </ul>

              {quizState.answerState === 'correct' && (
                <div className="alert alert-success">
                  <strong>Correct.</strong> The <strong>{quizState.activeRule.title}</strong> gesture is done by {quizState.activeRule.description}.
                </div>
              )}

              {quizState.answerState === 'incorrect' && (
                <div className="alert alert-danger">
                  <strong>Incorrect.</strong> The <strong>{quizState.activeRule.title}</strong> gesture is done by {quizState.activeRule.description}. The
                  correct answer was <strong>{quizState.activeRule.title}</strong>.
                </div>
              )}

              {quizState.answerState && !hasPassedQuiz && (
                <button type="button" className="btn btn-outline-primary" onClick={advanceQuizQuestion}>
                  Next Question
                </button>
              )}

              {hasPassedQuiz && (
                <div className="alert alert-success mb-0">
                  <strong>Quiz passed.</strong> Complete reCAPTCHA below to reveal the contact link.
                </div>
              )}
            </div>
          )}

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
            <>
              <div className="alert alert-success mb-0" role="alert">
                <strong>Verified.</strong>{' '}
                <a
                  href={revealedContact.href}
                  target={revealedContact.target || '_self'}
                  rel={revealedContact.target === '_blank' ? 'noopener noreferrer' : undefined}
                >
                  {revealedContact.value}
                </a>
              </div>
              <p className="mt-2"><strong>Note: </strong>Sometimes organizers change the link/number so please be understanding if the link is still not available.  We try to keep this as up to date as possible.</p>
            </>
          )}
        </div>
      </Modal>
    </>
  )
}
