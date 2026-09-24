import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

type ModalProps = {
  title: string
  onClose: () => void
  children: React.ReactNode
  width?: number
}

/**
 * Accessible modal dialog with backdrop.
 * Uses React portal to render outside the editor DOM tree.
 */
export const Modal: React.FC<ModalProps> = ({ title, onClose, children, width = 400 }) => {
  const dialogRef  = useRef<HTMLDivElement>(null)
  // Keep a stable ref so the mount-only effect always calls the latest onClose
  // without re-running (which would steal focus from inputs on every keystroke)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    // Focus the dialog once on mount so Escape works immediately
    dialogRef.current?.focus()
    const prev = document.activeElement as HTMLElement | null

    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCloseRef.current()
    }
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('keydown', handleKey)
      prev?.focus()
    }
  }, []) // ← intentionally empty: run only on mount/unmount

  return createPortal(
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div
        ref={dialogRef}
        className="modal-dialog"
        style={{ width }}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
      >
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Fechar">✕</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>,
    document.body
  )
}

// ─── Form helpers ─────────────────────────────────────────────────────────────

type FormFieldProps = {
  label: string
  unit?: string
  children: React.ReactNode
  hint?: string
}

export const FormField: React.FC<FormFieldProps> = ({ label, unit, children, hint }) => (
  <div className="form-field">
    <label className="form-field__label">{label}</label>
    <div className="form-field__row">
      {children}
      {unit && <span className="form-field__unit">{unit}</span>}
    </div>
    {hint && <span className="form-field__hint">{hint}</span>}
  </div>
)

type FormSectionProps = { title?: string; children: React.ReactNode }
export const FormSection: React.FC<FormSectionProps> = ({ title, children }) => (
  <div className="form-section">
    {title && <div className="form-section__title">{title}</div>}
    {children}
  </div>
)

type FormActionsProps = { children: React.ReactNode }
export const FormActions: React.FC<FormActionsProps> = ({ children }) => (
  <div className="form-actions">{children}</div>
)

export const BtnPrimary: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, ...props }) => (
  <button className="btn btn--primary" {...props}>{children}</button>
)

export const BtnSecondary: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, ...props }) => (
  <button className="btn btn--secondary" {...props}>{children}</button>
)
