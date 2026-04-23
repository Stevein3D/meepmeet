'use client'

import { useEffect } from 'react'
import { createPortal } from 'react-dom'

interface WoodModalProps {
  onClose: () => void
  maxWidth?: number | string
  ariaLabel?: string
  children: React.ReactNode
}

export default function WoodModal({ onClose, maxWidth = 560, ariaLabel, children }: WoodModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-box"
        style={{ maxWidth }}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
      >
        <div className="modal-overlay-tint" />
        {children}
      </div>
    </div>,
    document.body
  )
}
