import { useEffect, useState } from 'react'
import { Minus, Plus, X } from './Icons'

export function Modal({ open, onClose, title, subtitle, children, footer, wide = false }) {
  useEffect(() => {
    if (!open) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    document.body.classList.add('no-scroll')
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.classList.remove('no-scroll')
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        className={`modal ${wide ? 'modal--wide' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header className="modal-head">
          <div>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button className="icon-button icon-button--quiet" onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </header>
        <div className="modal-body">{children}</div>
        {footer && <footer className="modal-footer">{footer}</footer>}
      </div>
    </div>
  )
}

export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel = 'Eliminar',
  cancelLabel = 'Cancelar',
  onConfirm,
  onClose,
  danger = true,
  busy = false,
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose} disabled={busy}>
            {cancelLabel}
          </button>
          <button
            className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? 'Guardando…' : confirmLabel}
          </button>
        </>
      }
    >
      <div className="confirm-text">{children}</div>
    </Modal>
  )
}

export function NumberField({
  label,
  value,
  onChange,
  min = 1,
  max = 180,
  step = 1,
  suffix = 'min',
  hint,
}) {
  const [text, setText] = useState(String(value))

  useEffect(() => {
    setText(String(value))
  }, [value])

  const commit = () => {
    const parsed = Number(text)
    if (!Number.isFinite(parsed)) {
      setText(String(value))
      return
    }
    const clamped = Math.min(max, Math.max(min, Math.round(parsed)))
    setText(String(clamped))
    if (clamped !== value) onChange(clamped)
  }

  const stepBy = (delta) => {
    const parsed = Number(text)
    const base = Number.isFinite(parsed) ? parsed : value
    const next = Math.min(max, Math.max(min, Math.round(base + delta)))
    setText(String(next))
    if (next !== value) onChange(next)
  }

  return (
    <div className="field">
      <span className="field-label">{label}</span>
      <div className="stepper">
        <button
          type="button"
          className="stepper-btn"
          onClick={() => stepBy(-step)}
          aria-label={`Restar a ${label}`}
          disabled={value <= min && Number(text) <= min}
        >
          <Minus size={15} />
        </button>
        <label className="stepper-input-wrap">
          <input
            className="stepper-input"
            type="number"
            inputMode="numeric"
            min={min}
            max={max}
            value={text}
            onChange={(event) => setText(event.target.value)}
            onBlur={commit}
            onKeyDown={(event) => {
              if (event.key === 'Enter') event.currentTarget.blur()
            }}
          />
          <span className="stepper-suffix">{suffix}</span>
        </label>
        <button
          type="button"
          className="stepper-btn"
          onClick={() => stepBy(step)}
          aria-label={`Sumar a ${label}`}
          disabled={value >= max && Number(text) >= max}
        >
          <Plus size={15} />
        </button>
      </div>
      {hint && <span className="field-hint">{hint}</span>}
    </div>
  )
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  maxLength = 40,
  hint,
  autoFocus = false,
}) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <input
        className="input"
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        autoFocus={autoFocus}
      />
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  )
}

export function Toggle({ label, description, checked, onChange }) {
  return (
    <div className="toggle-row">
      <div className="toggle-text">
        <span className="toggle-label">{label}</span>
        {description && <span className="field-hint">{description}</span>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        className={`toggle ${checked ? 'is-on' : ''}`}
        onClick={() => onChange(!checked)}
      >
        <span className="toggle-thumb" />
      </button>
    </div>
  )
}

export function ColorPicker({ value, onChange }) {
  return (
    <div className="field">
      <span className="field-label">Color del perfil</span>
      <div className="color-grid">
        {['#ff7a66', '#f5a524', '#8b5cf6', '#4fd1c5', '#38bdf8', '#f472b6', '#a3e635', '#94a3b8'].map(
          (color) => (
            <button
              key={color}
              type="button"
              className={`color-swatch ${value === color ? 'is-active' : ''}`}
              style={{ background: color }}
              onClick={() => onChange(color)}
              aria-label={`Elegir color ${color}`}
              aria-pressed={value === color}
            />
          )
        )}
      </div>
    </div>
  )
}

export function Segmented({ options, value, onChange, disabled = false }) {
  return (
    <div className={`segmented ${disabled ? 'is-disabled' : ''}`} role="tablist">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={value === option.value}
          className={`segmented-item ${value === option.value ? 'is-active' : ''}`}
          onClick={() => onChange(option.value)}
          disabled={disabled}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
