'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import DeleteGameButton from '../DeleteGameButton'
import OwnershipButton from '../OwnershipButton'
import WantToPlayButton from '../WantToPlayButton'
import GameDetailsModal from '../GameDetailsModal'
import styles from './GameCard.module.css'

interface GameCardProps {
  game: {
    id: string
    bggId: number | null
    name: string
    image: string | null
    description: string | null
    mechanisms: string[]
    minPlayers: number
    maxPlayers: number
    playtime: number
    complexity: number | null
    yearPublished: number | null
    owners: Array<{
      userId: string
      user: {
        name: string
      }
    }>
  }
  userId: string | null
  userOwnsGame: boolean
  userWantsGame: boolean
  wantCount: number
}

export default function GameCard({ game, userId, userOwnsGame, userWantsGame, wantCount }: GameCardProps) {
  const [showControls, setShowControls] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  const handleToggle = () => {
    if (showControls) {
      setShowControls(false)
      setIsClosing(true)
      setTimeout(() => setIsClosing(false), 300)
    } else {
      setShowControls(true)
    }
  }

  const hasDetails = !!(game.description || game.mechanisms.length > 0 || game.bggId)

  return (
    <>
      <div className="relative flex flex-col overflow-hidden shadow-xl" style={{
        border: '4px solid #8B6F47',
        borderRadius: '8px',
        backgroundImage: 'url(/wood-bg.jpg)',
        backgroundSize: '100%',
        backgroundRepeat: 'repeat-y',
        backgroundPosition: 'center',
        backgroundColor: 'rgba(28, 16, 8, 0.6)',
        backgroundBlendMode: 'multiply',
        boxShadow: '0 10px 25px rgba(0,0,0,0.5), inset 0 1px 0 rgba(201,169,97,0.3)'
      }}>
        {/* Toggle button for Edit/Delete controls */}
        {userId && (
          <button
            onClick={handleToggle}
            className="absolute right-2 z-10 w-8 h-8 rounded-full flex items-center justify-center"
            style={{
              bottom: showControls ? 'calc(1.35rem + 64px)' : '1.35rem',
              background: 'linear-gradient(135deg, #C9A961, #8B6F47)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
              color: '#1A0F08',
              transition: 'bottom 0.3s ease-out'
            }}
            aria-label="Toggle controls"
          >
            <svg
              className={`w-4 h-4 transition-transform ${showControls ? '' : 'rotate-180'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}

        <div className="p-4 flex flex-col h-full">
          {game.image && (
            <div className="relative w-full h-56 mb-4 rounded overflow-hidden">
              <Image
                src={game.image}
                alt={game.name}
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          )}

          <h2 className="text-xl font-bold mb-3" style={{
            color: '#F5E6D3',
            textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
          }}>
            {game.name}
          </h2>

          <div className="mt-2 text-sm space-y-1 flex-grow" style={{ color: '#E8D4B8' }}>
            <p>{game.minPlayers}-{game.maxPlayers} players · {game.playtime} min</p>
            {game.yearPublished && <p>Published: {game.yearPublished}</p>}
            {game.complexity && <p>Complexity: {game.complexity.toFixed(1)}/5</p>}
            {game.owners.length > 0 && (
              <p className="mt-1">
                Owned by: {game.owners.map(o => o.user.name).join(', ')}
              </p>
            )}
          </div>

          {/* Action row: Want to Play + Ownership (logged-in only) */}
          {userId && (
            <div className="mt-3 flex gap-2 flex-wrap">
              <WantToPlayButton
                gameId={game.id}
                initialWanted={userWantsGame}
                wantCount={wantCount}
              />
              <OwnershipButton gameId={game.id} initialOwned={userOwnsGame} />
            </div>
          )}

          {/* Details button — always visible when there's content */}
          {hasDetails && (
            <div className="mt-2 mb-1">
              <button
                onClick={() => setShowDetails(true)}
                className={styles.detailsBtn}
              >
                View Details ↗
              </button>
            </div>
          )}
        </div>

        {/* Slide-up Edit/Delete controls */}
        {(showControls || isClosing) && userId && (
          <div
            className={`absolute bottom-0 left-0 right-0 flex gap-2 p-4 ${isClosing ? 'animate-slideDown' : 'animate-slideUp'}`}
            style={{
              background: 'rgba(20, 12, 6, 0.95)',
              borderTop: '2px solid #8B6F47'
            }}
          >
            <Link
              href={`/games/${game.id}/edit`}
              className="flex-1 px-3 py-2 text-center rounded font-medium transition-all"
              style={{
                border: '2px solid #C9A961',
                color: '#C9A961',
                background: 'rgba(201,169,97,0.1)'
              }}
            >
              Edit
            </Link>
            <DeleteGameButton gameId={game.id} gameName={game.name} />
          </div>
        )}
      </div>

      {/* Details modal (rendered via portal) */}
      {showDetails && (
        <GameDetailsModal
          game={game}
          onClose={() => setShowDetails(false)}
        />
      )}
    </>
  )
}
