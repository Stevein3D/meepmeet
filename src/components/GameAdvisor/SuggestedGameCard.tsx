'use client';
import { useState, useEffect } from 'react';
import { SuggestedGame } from './index';
import styles from './GameAdvisor.module.css';

interface SuggestedGameCardProps {
  game: SuggestedGame;
}

type ActionState = 'idle' | 'loading' | 'done' | 'error';

export default function SuggestedGameCard({ game }: SuggestedGameCardProps) {
  const [interestState, setInterestState] = useState<ActionState>('idle');
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/games/${game.id}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.image) setImageUrl(data.image); })
      .catch(() => {});
  }, [game.id]);

  async function addToInterests() {
    if (interestState !== 'idle') return;
    setInterestState('loading');
    try {
      const res = await fetch('/api/interests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId: game.id }),
      });
      const data = await res.json();
      setInterestState(data.success ? 'done' : 'error');
    } catch {
      setInterestState('error');
    }
  }

  const interestLabel = {
    idle: '+ Interests',
    loading: '...',
    done: '✓ Saved',
    error: 'Failed',
  }[interestState];

  return (
    <div className={styles.gameCard}>
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt={game.name} className={styles.gameThumb} />
      ) : (
        <div className={styles.gameThumbPlaceholder} />
      )}
      <span className={styles.gameName}>{game.name}</span>
      <div className={styles.cardActions}>
        <button
          className={`${styles.cardButton} ${interestState === 'done' ? styles.done : ''} ${interestState === 'error' ? styles.error : ''}`}
          onClick={addToInterests}
          disabled={interestState !== 'idle'}
        >
          {interestLabel}
        </button>
      </div>
    </div>
  );
}
