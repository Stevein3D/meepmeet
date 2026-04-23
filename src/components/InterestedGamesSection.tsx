'use client'

import { useState } from 'react'
import GameInfoButton from './GameInfoButton'

type WantGame = {
  id: string
  name: string
  image: string | null
  bggId: number | null
  description: string | null
  categories: string[]
  mechanisms: string[]
  minPlayers: number
  maxPlayers: number
  playtime: number
  complexity: number | null
  yearPublished: number | null
}

interface InterestedGamesSectionProps {
  games: WantGame[]
  isOwner: boolean
}

export default function InterestedGamesSection({ games: initialGames, isOwner }: InterestedGamesSectionProps) {
  const [games, setGames] = useState(initialGames)

  const handleRemove = async (gameId: string) => {
    setGames(prev => prev.filter(g => g.id !== gameId))
    await fetch(`/api/games/${gameId}/want`, { method: 'POST' })
  }

  if (games.length === 0) {
    return (
      <p className="text-sm opacity-60" style={{ color: '#E8D4B8' }}>No games marked as interested yet.</p>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
      {games.map(game => (
        <div key={game.id} className="interested-game-item flex items-center gap-3 px-3 py-2">
          <GameInfoButton game={game} />
          {isOwner && (
            <button
              onClick={() => handleRemove(game.id)}
              aria-label={`Remove ${game.name} from interested`}
              className="btn-icon-ghost flex-shrink-0"
              style={{ fontSize: '0.875rem', padding: '0.15rem 0.3rem', color: 'rgba(232,212,184,0.35)' }}
            >
              ✕
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
