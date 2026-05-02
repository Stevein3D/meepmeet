import type { CSSProperties, ReactNode } from 'react'

interface WoodPanelProps {
  children: ReactNode
  className?: string
  style?: CSSProperties
}

const OUTER: CSSProperties = {
  position: 'relative',
  overflow: 'hidden',
  border: '3px solid #8B6F47',
  borderRadius: '8px',
  backgroundImage: 'url(/wood-bg.jpg)',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
}

const TINT: CSSProperties = {
  position: 'absolute',
  inset: 0,
  background: 'rgba(16, 8, 3, 0.68)',
  pointerEvents: 'none',
  zIndex: 0,
}

const CONTENT: CSSProperties = {
  position: 'relative',
  zIndex: 1,
}

export default function WoodPanel({ children, className, style }: WoodPanelProps) {
  return (
    <div style={{ ...OUTER, ...style }} className={className}>
      <div style={TINT} aria-hidden="true" />
      <div style={CONTENT}>
        {children}
      </div>
    </div>
  )
}
