import { useEffect } from 'react'

export default function Modal ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  id = 'app-modal',
  size = 'md'
}) {
  useEffect(() => {
    if (!isOpen) {
      document.body.classList.remove('modal-open')
      document.body.style.removeProperty('overflow')
      return
    }

    document.body.classList.add('modal-open')
    document.body.style.overflow = 'hidden'

    const onKeyDown = function (event) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.classList.remove('modal-open')
      document.body.style.removeProperty('overflow')
    }
  }, [isOpen, onClose])

  if (!isOpen) {
    return null
  }

  const dialogSize = size === 'lg'
    ? 'modal-lg'
    : size === 'sm'
      ? 'modal-sm'
      : ''

  return (
    <>
      <div
        className="modal fade show"
        id={id}
        tabIndex="-1"
        role="dialog"
        aria-modal="true"
        style={{ display: 'block' }}
        onClick={onClose}
      >
        <div className={`modal-dialog ${dialogSize}`} role="document" onClick={(event) => event.stopPropagation()}>
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{title}</h5>
              <button type="button" className="btn-close" aria-label="Close" onClick={onClose}></button>
            </div>
            <div className="modal-body">
              {children}
            </div>
            {footer && (
              <div className="modal-footer">
                {footer}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show"></div>
    </>
  )
}
