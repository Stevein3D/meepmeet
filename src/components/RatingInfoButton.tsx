'use client'

import { useState } from 'react'

const SCALE = [
  { score: 10, text: 'Outstanding. Always want to play and expect this will never change.' },
  { score: 9,  text: 'Excellent game. Always want to play it.' },
  { score: 8,  text: 'Very good game. I like to play. Probably I\'ll suggest it and will never turn down a game.' },
  { score: 7,  text: 'Good game, usually willing to play.' },
  { score: 6,  text: 'Ok game, some fun or challenge at least, will play sporadically if in the right mood.' },
  { score: 5,  text: 'Average game, slightly boring, take it or leave it.' },
  { score: 4,  text: 'Not so good, it doesn\'t get me but could be talked into it on occasion.' },
  { score: 3,  text: 'Likely won\'t play this again although could be convinced. Bad.' },
  { score: 2,  text: 'Extremely annoying game, won\'t play this ever again.' },
  { score: 1,  text: 'Defies description of a game. You won\'t catch me dead playing this. Clearly broken.' },
]

// Interpolate gold → amber → red across scores 10→1
function scoreColor(score: number): string {
  if (score >= 9) return '#C9A961'
  if (score >= 7) return '#b8924a'
  if (score >= 5) return '#a07838'
  if (score >= 3) return '#c06030'
  return '#b84030'
}

export default function RatingInfoButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Rating scale info"
        style={{
          width: '1.25rem',
          height: '1.25rem',
          borderRadius: '50%',
          border: '1px solid rgba(201,169,97,0.5)',
          background: 'rgba(201,169,97,0.1)',
          color: '#C9A961',
          fontSize: '0.7rem',
          fontWeight: 700,
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          lineHeight: 1,
          verticalAlign: 'middle',
        }}
      >
        ?
      </button>

      {open && (
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
          }}
          onClick={() => setOpen(false)}
        >
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '480px',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              border: '3px solid #8B6F47',
              borderRadius: '10px',
              backgroundImage: 'url(/wood-bg.jpg)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
              overflow: 'hidden',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Overlay */}
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(20,10,4,0.92)', zIndex: 0, pointerEvents: 'none' }} />

            {/* Header */}
            <div style={{
              position: 'relative', zIndex: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '1rem 1.25rem 0.75rem',
              borderBottom: '1px solid rgba(139,111,71,0.4)',
              flexShrink: 0,
            }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#F5E6D3', margin: 0 }}>
                Rating Scale
              </h3>
              <button
                onClick={() => setOpen(false)}
                style={{
                  width: '2rem', height: '2rem', borderRadius: '50%',
                  border: '1px solid rgba(201,169,97,0.4)',
                  background: 'rgba(201,169,97,0.1)',
                  color: '#C9A961', fontSize: '0.85rem',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div style={{
              position: 'relative', zIndex: 1,
              overflowY: 'auto',
              padding: '0.75rem 1.25rem 1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}>
              {SCALE.map(({ score, text }) => (
                <div key={score} style={{ display: 'flex', gap: '0.75rem', alignItems: 'baseline' }}>
                  <span style={{
                    fontWeight: 700,
                    fontSize: '1rem',
                    color: scoreColor(score),
                    flexShrink: 0,
                    width: '1.5rem',
                    textAlign: 'right',
                  }}>
                    {score}
                  </span>
                  <span style={{ fontSize: '0.85rem', color: '#D4C4A8', lineHeight: 1.5 }}>
                    {text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
