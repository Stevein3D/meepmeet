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
      <div className={styles.card}>
        {/* Toggle button for Edit/Delete controls */}
        {userId && (
          <button
            onClick={handleToggle}
            className={`${styles.toggleButton} ${showControls ? styles.expanded : styles.collapsed}`}
            aria-label="Toggle controls"
          >
            <svg
              className={`${styles.toggleIcon} ${showControls ? '' : styles.rotated}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}

        <div className={styles.cardContent}>
          {/* Image area — always reserves space */}
          <div className={styles.imageContainer}>
            {game.image ? (
              <Image
                src={game.image}
                alt={game.name}
                fill
                className="object-contain"
                unoptimized
              />
            ) : (
              <span className={styles.imagePlaceholder}>♟</span>
            )}
          </div>

          <h2 className={styles.title}>{game.name}</h2>

          {/* Details button — sits under the title */}
          {hasDetails && (
            <button
              onClick={() => setShowDetails(true)}
              className={styles.detailsBtn}
            >
              View Details ↗
            </button>
          )}

          <div className={styles.details}>
            <p>{game.minPlayers}–{game.maxPlayers} players · {game.playtime} min</p>
            {game.yearPublished && <p>Published: {game.yearPublished}</p>}
            {game.complexity && <p>Complexity: {game.complexity.toFixed(1)}/5</p>}
            {game.owners.length > 0 && (
              <p className={styles.owners}>
                Owned by: {game.owners.map(o => o.user.name).join(', ')}
              </p>
            )}
          </div>

          {/* Action row: Want to Play + Ownership (logged-in only) */}
          {userId && (
            <div className={styles.ownershipContainer}>
              <WantToPlayButton
                gameId={game.id}
                initialWanted={userWantsGame}
                wantCount={wantCount}
              />
              <OwnershipButton gameId={game.id} initialOwned={userOwnsGame} />
            </div>
          )}
        </div>

        {/* Slide-up Edit/Delete controls */}
        {(showControls || isClosing) && userId && (
          <div className={`${styles.controls} ${isClosing ? styles.slideDown : styles.slideUp}`}>
            <Link href={`/games/${game.id}/edit`} className={styles.editLink}>
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
