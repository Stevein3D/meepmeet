'use client'

import { useEffect, useState } from 'react'

export default function BackToTopButton() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <style>{`
        @keyframes bobUp {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-4px); }
        }
        .back-to-top-arrow {
          animation: bobUp 1.4s ease-in-out infinite;
          display: block;
          line-height: 1;
        }
      `}</style>

      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Back to top"
        style={{
          position: 'fixed',
          bottom: '1.75rem',
          right: '1.75rem',
          zIndex: 100,
          width: '2.75rem',
          height: '2.75rem',
          borderRadius: '50%',
          border: '2px solid #8B6F47',
          background: 'rgba(18, 48, 28, 0.92)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.5), inset 0 1px 0 rgba(201,169,97,0.15)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: visible ? 1 : 0,
          pointerEvents: visible ? 'auto' : 'none',
          transition: 'opacity 0.25s ease, border-color 0.2s',
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = '#C9A961')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = '#8B6F47')}
      >
        <span className="back-to-top-arrow" style={{ fontSize: '1.1rem', color: '#C9A961' }}>
          ↑
        </span>
      </button>
    </>
  )
}
