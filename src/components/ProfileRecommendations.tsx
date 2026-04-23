'use client'

import { useState, useEffect } from 'react'
import GameDetailsModal from './GameDetailsModal'
import type { BaseGame } from '@/lib/types'

type Recommendation = {
  id: string
  reason: string
  game: BaseGame
}

interface ProfileRecommendationsProps {
  userId: string
  initialRecs: Recommendation[]
}

const PANEL_STYLE: React.CSSProperties = {
  border: '3px solid #8B6F47',
  borderRadius: '8px',
  backgroundImage: 'url(/wood-bg.jpg)',
  backgroundSize: '100%',
  backgroundRepeat: 'repeat-y',
  backgroundPosition: 'center',
  backgroundColor: 'rgba(28, 16, 8, 0.6)',
  backgroundBlendMode: 'multiply',
  boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
}

function SkeletonCard() {
  return (
    <div
      className="flex gap-3 p-3 rounded-lg animate-pulse"
      style={{ background: 'rgba(201,169,97,0.06)', border: '1px solid rgba(201,169,97,0.15)' }}
    >
      <div className="w-14 h-14 rounded flex-shrink-0" style={{ background: 'rgba(201,169,97,0.12)' }} />
      <div className="flex-1 flex flex-col gap-2 justify-center">
        <div className="h-3 rounded w-2/3" style={{ background: 'rgba(201,169,97,0.12)' }} />
        <div className="h-2.5 rounded w-full" style={{ background: 'rgba(201,169,97,0.08)' }} />
        <div className="h-2.5 rounded w-4/5" style={{ background: 'rgba(201,169,97,0.08)' }} />
      </div>
    </div>
  )
}

function RecCard({ rec }: { rec: Recommendation }) {
  const [showModal, setShowModal] = useState(false)
  const topMechs = rec.game.mechanisms.slice(0, 3)

  return (
    <>
      <div
        className="flex gap-3 p-3 rounded-lg"
        style={{ background: 'rgba(201,169,97,0.06)', border: '1px solid rgba(201,169,97,0.15)' }}
      >
        {/* Thumbnail — clickable */}
        <button
          onClick={() => setShowModal(true)}
          className="w-14 h-14 rounded flex-shrink-0 overflow-hidden"
          style={{
            background: 'rgba(201,169,97,0.1)',
            border: '1px solid rgba(201,169,97,0.2)',
            padding: 0,
            cursor: 'pointer',
          }}
          aria-label={`View details for ${rec.game.name}`}
        >
          {rec.game.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={rec.game.image} alt={rec.game.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xl opacity-40">▪</div>
          )}
        </button>

        {/* Info */}
        <div className="flex-1 min-w-0">
          {/* Title — clickable, no underline */}
          <button
            onClick={() => setShowModal(true)}
            className="font-semibold text-sm leading-tight mb-0.5 text-left w-full"
            style={{
              color: '#F5E6D3',
              fontFamily: 'var(--font-caudex)',
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              textDecoration: 'none',
            }}
          >
            {rec.game.name}
          </button>

          {/* Mechanics */}
          {topMechs.length > 0 && (
            <p className="text-xs mb-1" style={{ color: '#a8854a', fontFamily: 'var(--font-caudex)' }}>
              {topMechs.join(' · ')}
            </p>
          )}

          {/* Reason */}
          <p className="text-xs leading-snug" style={{ color: 'rgba(232,212,184,0.75)', fontFamily: 'var(--font-caudex)' }}>
            {rec.reason}
          </p>

          <p className="text-xs mt-1 opacity-50" style={{ color: '#E8D4B8' }}>
            {rec.game.minPlayers}–{rec.game.maxPlayers}p · {rec.game.playtime}min
          </p>
        </div>
      </div>

      {showModal && (
        <GameDetailsModal game={rec.game} onClose={() => setShowModal(false)} />
      )}
    </>
  )
}

export default function ProfileRecommendations({ userId, initialRecs }: ProfileRecommendationsProps) {
  const [recs, setRecs] = useState<Recommendation[]>(initialRecs)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (initialRecs.length === 0) {
      generate()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function generate(msg?: string) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/meeps/${userId}/recommendations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg ?? undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      setRecs(data.recommendations)
      setMessage('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    generate(message.trim() || undefined)
  }

  const skeletonCount = recs.length || 3

  return (
    <section className="mb-8">
      <h2 className="text-lg font-bold mb-3" style={{ color: '#C9A961' }}>
        Recommended for You
      </h2>

      <div style={PANEL_STYLE} className="p-4">
        <div className="flex flex-col gap-3 mb-4">
          {loading
            ? Array.from({ length: skeletonCount }).map((_, i) => <SkeletonCard key={i} />)
            : recs.map(rec => <RecCard key={rec.id} rec={rec} />)}

          {!loading && recs.length === 0 && !error && (
            <p className="text-sm opacity-60 py-2" style={{ color: '#E8D4B8' }}>
              Rate some games to get personalised recommendations.
            </p>
          )}

          {error && (
            <p className="text-sm py-2" style={{ color: '#c87a7a' }}>{error}</p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Want different picks? Tell me what you're in the mood for…"
            disabled={loading}
            className="flex-1 rounded px-3 py-2 text-sm outline-none"
            style={{
              background: 'rgba(20,12,6,0.6)',
              border: '1px solid rgba(139,111,71,0.5)',
              color: '#E8D4B8',
              fontFamily: 'var(--font-caudex)',
            }}
          />
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-semibold rounded flex-shrink-0"
            style={{
              background: loading ? 'rgba(201,169,97,0.15)' : 'rgba(201,169,97,0.2)',
              border: '1px solid rgba(201,169,97,0.5)',
              color: '#C9A961',
              cursor: loading ? 'default' : 'pointer',
            }}
          >
            {loading ? '…' : '↺ Refresh'}
          </button>
        </form>
      </div>
    </section>
  )
}
