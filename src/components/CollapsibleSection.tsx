'use client'

import { useState, type CSSProperties, type ReactNode } from 'react'

interface CollapsibleSectionProps {
  /** Always-visible content (title, summary, etc.) */
  header: ReactNode
  /** Collapsible content */
  children: ReactNode
  className?: string
  style?: CSSProperties
  bodyClassName?: string
  bodyStyle?: CSSProperties
  ariaLabel?: string
}

/**
 * Card whose body collapses behind a circular toggle (top-right). Defaults to
 * collapsed on mobile and expanded on desktop via CSS — so there's no hydration
 * mismatch or flash. Once the user clicks, an explicit override takes over.
 */
export default function CollapsibleSection({
  header,
  children,
  className = '',
  style,
  bodyClassName = '',
  bodyStyle,
  ariaLabel = 'section',
}: CollapsibleSectionProps) {
  // null = follow CSS default (collapsed < 640px, open ≥ 640px); true = collapsed; false = open
  const [collapsed, setCollapsed] = useState<boolean | null>(null)

  const bodyVisibility =
    collapsed === null ? 'hidden sm:block' : collapsed ? 'hidden' : 'block'
  // Base chevron points down (collapsed); rotate 180 when open.
  const iconRotation =
    collapsed === null ? 'sm:rotate-180' : collapsed ? '' : 'rotate-180'

  const toggle = () => {
    const current =
      collapsed === null
        ? !window.matchMedia('(min-width: 640px)').matches // default: collapsed on mobile
        : collapsed
    setCollapsed(!current)
  }

  return (
    <div className={className} style={style}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">{header}</div>
        <button
          type="button"
          onClick={toggle}
          aria-label={`Toggle ${ariaLabel}`}
          className="collapse-toggle flex-shrink-0"
        >
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${iconRotation}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
      <div className={`${bodyVisibility} ${bodyClassName}`} style={bodyStyle}>
        {children}
      </div>
    </div>
  )
}
