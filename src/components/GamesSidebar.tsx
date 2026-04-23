'use client'

import { useState } from 'react'
import Image from 'next/image'
import GameDetailsModal from './GameDetailsModal'
import type { BaseGame } from '@/lib/types'

interface GamesSidebarProps {
  recentlyAdded: BaseGame[]
  topRated: { game: BaseGame; avg: number }[]
  topInterest: { game: BaseGame; count: number; users: string[] }[]
}

function GameRow({
  game,
  meta,
}: {
  game: BaseGame
  meta?: React.ReactNode
}) {
  const [showModal, setShowModal] = useState(false)
  const hasDetails = !!(game.description || game.mechanisms.length > 0 || game.bggId)

  return (
    <>
      <div className="flex items-center gap-2">
        {game.image && (
          <div className="relative flex-shrink-0 rounded overflow-hidden" style={{ width: 32, height: 32 }}>
            <Image src={game.image} alt={game.name} fill className="object-contain" unoptimized />
          </div>
        )}
        <button
          onClick={() => hasDetails && setShowModal(true)}
          className="flex-1 min-w-0 text-left text-sm leading-snug"
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: hasDetails ? 'pointer' : 'default',
            color: hasDetails ? '#C9A961' : '#E8D4B8',
            textDecoration: hasDetails ? 'underline' : 'none',
            textUnderlineOffset: '2px',
            wordBreak: 'break-word',
          }}
        >
          {game.name}
        </button>
        {meta}
      </div>
      {showModal && <GameDetailsModal game={game} onClose={() => setShowModal(false)} />}
    </>
  )
}

function InterestBadge({ count, users }: { count: number; users: string[] }) {
  const [show, setShow] = useState(false)

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <span
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        style={{
          fontSize: '0.75rem',
          color: '#C9A961',
          fontWeight: 600,
          cursor: 'default',
          whiteSpace: 'nowrap',
        }}
      >
        ♥ {count}
      </span>
      {show && users.length > 0 && (
        <div style={{
          position: 'absolute',
          bottom: 'calc(100% + 6px)',
          right: 0,
          background: 'rgba(14,8,3,0.97)',
          border: '1px solid rgba(201,169,97,0.4)',
          borderRadius: '5px',
          padding: '0.3rem 0.6rem',
          fontSize: '0.75rem',
          color: '#E8D4B8',
          whiteSpace: 'nowrap',
          zIndex: 50,
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          pointerEvents: 'none',
        }}>
          {users.join(', ')}
        </div>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="sidebar-panel" style={{ padding: '1rem 1.1rem' }}>
      <div className="sidebar-panel-tint" />
      <div className="sidebar-panel-content">
        <h3 className="sidebar-section-title">{title}</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {children}
        </div>
      </div>
    </div>
  )
}

export default function GamesSidebar({ recentlyAdded, topRated, topInterest }: GamesSidebarProps) {
  return (
    <div className="flex flex-col gap-4">

      <Section title="Recently Added">
        {recentlyAdded.map(game => (
          <GameRow key={game.id} game={game} />
        ))}
      </Section>

      <Section title="Top Rated">
        {topRated.map(({ game, avg }) => (
          <GameRow
            key={game.id}
            game={game}
            meta={
              <span style={{ fontSize: '0.75rem', color: '#C9A961', fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}>
                ⭐ {avg.toFixed(1)}
              </span>
            }
          />
        ))}
      </Section>

      <Section title="Top Interest">
        {topInterest.map(({ game, count, users }) => (
          <GameRow
            key={game.id}
            game={game}
            meta={<InterestBadge count={count} users={users} />}
          />
        ))}
      </Section>

    </div>
  )
}
