'use client'

import { useState } from 'react'

interface WantToPlayButtonProps {
  gameId: string
  initialWanted: boolean
  wantCount: number
}

export default function WantToPlayButton({ gameId, initialWanted, wantCount }: WantToPlayButtonProps) {
  const [wanted, setWanted] = useState(initialWanted)
  const [count, setCount] = useState(wantCount)
  const [loading, setLoading] = useState(false)

  const toggle = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/games/${gameId}/want`, { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        const nowWanted: boolean = data.wanted
        setWanted(nowWanted)
        setCount(prev => nowWanted ? prev + 1 : prev - 1)
      }
    } catch (err) {
      console.error('Failed to toggle want-to-play:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className="px-3 py-2 text-sm rounded font-medium transition-all disabled:opacity-50"
      style={{
        border: wanted ? '2px solid #C9A961' : '2px solid rgba(201,169,97,0.4)',
        background: wanted ? 'rgba(201,169,97,0.15)' : 'transparent',
        color: wanted ? '#C9A961' : 'rgba(201,169,97,0.6)',
      }}
    >
      {loading ? '…' : wanted ? `♥ Want to Play${count > 1 ? ` (${count})` : ''}` : `♡ Want to Play${count > 0 ? ` (${count})` : ''}`}
    </button>
  )
}
