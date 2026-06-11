'use client'

import WoodModal from './WoodModal'

interface ConfirmModalProps {
  title: string
  message: string
  confirmLabel?: string
  danger?: boolean
  busy?: boolean
  error?: string | null
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmModal({
  title,
  message,
  confirmLabel = 'Confirm',
  danger = false,
  busy = false,
  error = null,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <WoodModal onClose={onCancel} maxWidth={420} ariaLabel={title}>
      <div className="modal-header">
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--wood-text-light)', margin: 0 }}>
          {title}
        </h3>
        <button onClick={onCancel} className="modal-close-btn" aria-label="Close">✕</button>
      </div>

      <div className="modal-body">
        <p style={{ fontSize: '0.9rem', color: '#D4C4A8', lineHeight: 1.5, margin: 0 }}>
          {message}
        </p>
        {error && (
          <p style={{ fontSize: '0.85rem', color: '#E8A070', margin: '0.75rem 0 0' }}>
            {error}
          </p>
        )}
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
          <button onClick={onCancel} disabled={busy} className="btn btn-sm btn-secondary disabled:opacity-50">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className={`btn btn-sm ${danger ? 'btn-danger' : 'btn-primary'} disabled:opacity-50`}
          >
            {busy ? '...' : confirmLabel}
          </button>
        </div>
      </div>
    </WoodModal>
  )
}
