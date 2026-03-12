'use client'

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import styles from './GameCard/GameCard.module.css'

interface GameDetailsModalProps {
  game: {
    name: string
    bggId: number | null
    image: string | null
    description: string | null
    mechanisms: string[]
    minPlayers: number
    maxPlayers: number
    playtime: number
    complexity: number | null
    yearPublished: number | null
  }
  onClose: () => void
}

export default function GameDetailsModal({ game, onClose }: GameDetailsModalProps) {
  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return createPortal(
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={styles.modal}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={game.name}
      >
        {/* Header */}
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{game.name}</h2>
          <button className={styles.modalClose} onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className={styles.modalBody}>
          {/* Image */}
          {game.image && (
            <div className={styles.modalImage}>
              <Image
                src={game.image}
                alt={game.name}
                width={160}
                height={160}
                className={styles.modalImg}
                unoptimized
              />
            </div>
          )}

          {/* Quick stats */}
          <div className={styles.modalStats}>
            <span>{game.minPlayers}–{game.maxPlayers} players</span>
            <span>·</span>
            <span>{game.playtime} min</span>
            {game.complexity && <><span>·</span><span>Complexity {game.complexity.toFixed(1)}/5</span></>}
            {game.yearPublished && <><span>·</span><span>{game.yearPublished}</span></>}
          </div>

          {/* BGG link */}
          {game.bggId && (
            <a
              href={`https://boardgamegeek.com/boardgame/${game.bggId}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.bggLink}
            >
              View on BoardGameGeek ↗&#xFE0E;
            </a>
          )}

          {/* Mechanisms */}
          {game.mechanisms.length > 0 && (
            <div className={styles.modalSection}>
              <h3 className={styles.modalSectionTitle}>Mechanisms</h3>
              <div className={styles.mechanismTags}>
                {game.mechanisms.map(m => (
                  <span key={m} className={styles.mechanismTag}>{m}</span>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {game.description && (
            <div className={styles.modalSection}>
              <h3 className={styles.modalSectionTitle}>Description</h3>
              <p className={styles.description}>{game.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
