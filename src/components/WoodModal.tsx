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
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        animation: 'fadeIn 0.15s ease-out',
      }}
      onClick={onClose}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth,
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          border: '3px solid var(--wood-border)',
          borderRadius: '10px',
          backgroundImage: 'url(/wood-bg.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          boxShadow: '0 20px 60px rgba(0,0,0,0.8), inset 0 1px 0 rgba(201,169,97,0.2)',
          overflow: 'hidden',
          animation: 'slideInUp 0.2s ease-out',
        }}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
      >
        {/* iOS-safe dark overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(20,10,4,0.92)', zIndex: 0, pointerEvents: 'none' }} />
        {children}
      </div>
    </div>,
    document.body
  )
}
