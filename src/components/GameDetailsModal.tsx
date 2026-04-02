'use client'

import Image from 'next/image'
import WoodModal from './WoodModal'
import styles from './GameCard/GameCard.module.css'
import type { BaseGame } from '@/lib/types'

interface GameDetailsModalProps {
  game: BaseGame
  onClose: () => void
}

export default function GameDetailsModal({ game, onClose }: GameDetailsModalProps) {
  return (
    <WoodModal onClose={onClose} maxWidth={560} ariaLabel={game.name}>
      {/* Header */}
      <div className={styles.modalHeader}>
        <h2 className={styles.modalTitle}>{game.name}</h2>
        <button className={styles.modalClose} onClick={onClose} aria-label="Close">✕</button>
      </div>

      <div className={styles.modalBody}>
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

        <div className={styles.modalStats}>
          <span>{game.minPlayers}–{game.maxPlayers} players</span>
          <span>·</span>
          <span>{game.playtime} min</span>
          {game.complexity && <><span>·</span><span>Complexity {game.complexity.toFixed(1)}/5</span></>}
          {game.yearPublished && <><span>·</span><span>{game.yearPublished}</span></>}
        </div>

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

        {(game.categories ?? []).length > 0 && (
          <div className={styles.modalSection}>
            <h3 className={styles.modalSectionTitle}>Categories</h3>
            <div className={styles.mechanismTags}>
              {(game.categories ?? []).map(c => (
                <span key={c} className={styles.mechanismTag}>{c}</span>
              ))}
            </div>
          </div>
        )}

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

        {game.description && (
          <div className={styles.modalSection}>
            <h3 className={styles.modalSectionTitle}>Description</h3>
            <p className={styles.description}>{game.description}</p>
          </div>
        )}
      </div>
    </WoodModal>
  )
}
