'use client'

import { useState } from 'react'
import Image from 'next/image'
import GameDetailsModal from './GameDetailsModal'
import type { BaseGame } from '@/lib/types'

interface GameInfoButtonProps {
  game: BaseGame
}

export default function GameInfoButton({ game }: GameInfoButtonProps) {
  const [showModal, setShowModal] = useState(false)
  const hasDetails = !!(game.description || game.mechanisms.length > 0 || game.bggId)

  return (
    <>
      <button
        onClick={() => hasDetails && setShowModal(true)}
        className="flex items-center gap-2 flex-1 min-w-0 text-left"
        style={{ background: 'none', border: 'none', padding: 0, cursor: hasDetails ? 'pointer' : 'default' }}
      >
        {game.image && (
          <div className="relative w-7 h-7 rounded flex-shrink-0 overflow-hidden">
            <Image src={game.image} alt={game.name} fill className="object-contain" unoptimized />
          </div>
        )}
        <span
          className="text-sm"
          style={{
            color: hasDetails ? '#C9A961' : '#E8D4B8',
            wordBreak: 'break-word',
            textDecoration: hasDetails ? 'underline' : 'none',
            textUnderlineOffset: '2px',
          }}
        >
          {game.name}
        </span>
      </button>

      {showModal && (
        <GameDetailsModal game={game} onClose={() => setShowModal(false)} />
      )}
    </>
  )
}
