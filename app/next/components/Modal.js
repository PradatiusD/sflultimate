import { useEffect, useRef } from 'react'

export default function Modal ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  id = 'app-modal',
  size = 'md',
  closeDisabled = false
}) {
  const dialogRef = useRef(null)
  const closeRef = useRef(onClose)
  const disabledRef = useRef(closeDisabled)
  closeRef.current = onClose
  disabledRef.current = closeDisabled

  useEffect(() => {
    if (!isOpen) return
    const previousFocus = document.activeElement
    const previousOverflow = document.body.style.overflow
    const hadModalClass = document.body.classList.contains('modal-open')
    const dialog = dialogRef.current
    document.body.classList.add('modal-open')
    document.body.style.overflow = 'hidden'

    function focusable () {
      return Array.from(dialog.querySelectorAll('button, a[href], input, select, textarea, [tabindex]'))
        .filter(element => !element.disabled && element.tabIndex >= 0 && element.getClientRects().length)
    }
    const initial = focusable()[0] || dialog
    initial.focus()
    const onKeyDown = function (event) {
      if (event.key === 'Escape') {
        event.preventDefault()
        if (!disabledRef.current) closeRef.current()
      }
      if (event.key === 'Tab') {
        const items = focusable()
        const first = items[0]
        const last = items[items.length - 1]
        if (!first) {
          event.preventDefault()
          dialog.focus()
        } else if (event.shiftKey && (document.activeElement === first || !items.includes(document.activeElement))) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && (document.activeElement === last || !items.includes(document.activeElement))) {
          event.preventDefault()
          first.focus()
        }
      }
    }
    const onFocus = function (event) {
      if (!dialog.contains(event.target)) (focusable()[0] || dialog).focus()
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('focusin', onFocus)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('focusin', onFocus)
      if (!hadModalClass) document.body.classList.remove('modal-open')
      document.body.style.overflow = previousOverflow
      if (previousFocus && previousFocus.isConnected) previousFocus.focus()
    }
  }, [isOpen])

  if (!isOpen) return null
  const dialogSize = size === 'lg' ? 'modal-lg' : size === 'sm' ? 'modal-sm' : ''
  function close () {
    if (!disabledRef.current) closeRef.current()
  }

  return (
    <>
      <div
        ref={dialogRef}
        className="modal fade show"
        id={id}
        tabIndex="-1"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        aria-busy={closeDisabled}
        style={{ display: 'block' }}
        onClick={close}
      >
        <div className={`modal-dialog ${dialogSize}`} role="document" onClick={(event) => event.stopPropagation()}>
          <div className="modal-content">
            <div className="modal-header">
              <h5 id={`${id}-title`} className="modal-title">{title}</h5>
              <button type="button" className="btn-close" aria-label="Close" disabled={closeDisabled} onClick={close}></button>
            </div>
            <div className="modal-body">{children}</div>
            {footer && <div className="modal-footer">{footer}</div>}
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show"></div>
    </>
  )
}
