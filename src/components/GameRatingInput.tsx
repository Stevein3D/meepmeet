'use client'

import { useState } from 'react'

interface GameRatingInputProps {
  gameId: string
  initialRating: number | null
}

export default function GameRatingInput({ gameId, initialRating }: GameRatingInputProps) {
  const [value, setValue] = useState(initialRating !== null ? String(initialRating) : '')
  const [saved, setSaved] = useState(initialRating !== null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(false)

  const save = async (raw: string) => {
    const num = parseFloat(raw)
    if (isNaN(num) || num < 1 || num > 10) {
      setError(true)
      return
    }
    setError(false)
    setSaving(true)
    try {
      const res = await fetch(`/api/games/${gameId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: num }),
      })
      if (res.ok) {
        const data = await res.json()
        setValue(String(data.rating))
        setSaved(true)
      }
    } catch (err) {
      console.error('Failed to save rating:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex items-center gap-1.5 flex-shrink-0">
      <span className="text-xs opacity-60" style={{ color: '#E8D4B8' }}>Rating</span>
      <input
        type="number"
        min={1}
        max={10}
        step={0.1}
        value={value}
        onChange={e => { setValue(e.target.value); setSaved(false); setError(false) }}
        onBlur={e => { if (e.target.value) save(e.target.value) }}
        onKeyDown={e => { if (e.key === 'Enter') save(value) }}
        placeholder="—"
        disabled={saving}
        className="text-sm text-center rounded disabled:opacity-50"
        style={{
          width: '4rem',
          padding: '0.2rem 0.4rem',
          background: 'rgba(0,0,0,0.3)',
          border: error
            ? '1px solid rgba(220,100,100,0.7)'
            : saved
            ? '1px solid rgba(143,188,143,0.6)'
            : '1px solid rgba(201,169,97,0.4)',
          color: '#F5E6D3',
          outline: 'none',
        }}
      />
      <span className="text-xs opacity-40" style={{ color: '#E8D4B8' }}>/10</span>
    </div>
  )
}
