'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'

interface AvatarViewerProps {
  src?: string | null
  alt: string
  initials: string
  /** Sizing + text-size classes for the circle, e.g. "w-16 h-16 sm:w-20 sm:h-20 text-xl" */
  circleClassName?: string
}

const CIRCLE_STYLE = {
  border: '3px solid #C9A961',
  background: 'linear-gradient(135deg, #3a2010, #5c3a1e)',
  color: '#F5E6D3',
} as const

const CIRCLE_BASE =
  'relative rounded-full overflow-hidden flex items-center justify-center font-bold flex-shrink-0'

/**
 * Avatar that enlarges into a centered circular lightbox on hover (desktop) or
 * tap/click (everywhere). Replaces the link-to-profile behaviour when a photo
 * exists; falls back to a static initials circle when there's no image.
 */
export default function AvatarViewer({ src, alt, initials, circleClassName = '' }: AvatarViewerProps) {
  const [open, setOpen] = useState(false)
  const [pinned, setPinned] = useState(false)
  // Only affects event handlers (not markup), so a lazy client check is hydration-safe
  const [canHover] = useState(
    () => typeof window !== 'undefined' && (window.matchMedia?.('(hover: hover)').matches ?? false)
  )

  const close = () => { setOpen(false); setPinned(false) }

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); setPinned(false) } }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  // No photo → static initials circle, nothing to enlarge.
  if (!src) {
    return (
      <div className={`${CIRCLE_BASE} ${circleClassName}`} style={CIRCLE_STYLE}>
        <span>{initials}</span>
      </div>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPinned(true); setOpen(true) }}
        onMouseEnter={() => { if (canHover && !pinned) setOpen(true) }}
        onMouseLeave={() => { if (canHover && !pinned) setOpen(false) }}
        aria-label={`View ${alt}'s photo`}
        className={`avatar-trigger ${CIRCLE_BASE} ${circleClassName}`}
        style={CIRCLE_STYLE}
      >
        <Image src={src} alt={alt} fill className="object-cover" unoptimized />
      </button>

      {open && createPortal(
        <div
          className="avatar-lightbox"
          style={{ pointerEvents: pinned ? 'auto' : 'none' }}
          onClick={close}
        >
          <div className="avatar-lightbox-img" onClick={(e) => { e.stopPropagation(); close() }}>
            <Image
              src={src}
              alt={alt}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 85vw, 420px"
              unoptimized
            />
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
