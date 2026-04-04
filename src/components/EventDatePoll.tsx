'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface PollOption {
  id: string
  date: string
  confirmedAt: string | null
  votes: { userId: string }[]
}

interface EventDatePollProps {
  eventId: string
  options: PollOption[]
  currentUserId: string
  isGameMaster: boolean
  dateConfirmed: boolean
}

function formatPollDate(date: string) {
  return new Date(date).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/New_York',
  })
}

export default function EventDatePoll({
  eventId,
  options: initial,
  currentUserId,
  isGameMaster,
  dateConfirmed,
}: EventDatePollProps) {
  const router = useRouter()
  const [options, setOptions] = useState(initial)
  const [busy, setBusy] = useState<string | null>(null)
  const [confirming, setConfirming] = useState<string | null>(null)

  if (dateConfirmed || options.length === 0) return null

  const handleVote = async (optionId: string) => {
    setBusy(optionId)
    const res = await fetch(`/api/events/${eventId}/poll/${optionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'vote' }),
    })
    if (res.ok) {
      const { option } = await res.json()
      setOptions(prev => prev.map(o => (o.id === optionId ? { ...o, votes: option.votes } : o)))
    }
    setBusy(null)
  }

  const handleConfirm = async (optionId: string) => {
    if (!confirm('Confirm this date? This will set the event date and notify all members.')) return
    setConfirming(optionId)
    const res = await fetch(`/api/events/${eventId}/poll/${optionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'confirm' }),
    })
    if (res.ok) {
      router.refresh()
    }
    setConfirming(null)
  }

  return (
    <div
      style={{
        background: 'rgba(28,16,8,0.55)',
        border: '1px solid rgba(139,111,71,0.5)',
        borderRadius: '0.5rem',
        padding: '1.25rem',
        marginBottom: '1.25rem',
        width: '100%', 
        maxWidth: '600px'
      }}
    >
      <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.95rem', fontWeight: 700, color: '#C9A961' }}>
        Vote on a Date
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {options.map(opt => {
          const voted = opt.votes.some(v => v.userId === currentUserId)
          const count = opt.votes.length
          return (
            <div
              key={opt.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.5rem 0.75rem',
                borderRadius: '0.375rem',
                background: voted ? 'rgba(143,188,143,0.12)' : 'rgba(201,169,97,0.06)',
                border: voted ? '1px solid rgba(143,188,143,0.4)' : '1px solid rgba(201,169,97,0.2)',
              }}
            >
              <button
                onClick={() => handleVote(opt.id)}
                disabled={!!busy}
                style={{
                  flexShrink: 0,
                  width: '1.25rem',
                  height: '1.25rem',
                  borderRadius: '50%',
                  border: voted ? '2px solid #8FBC8F' : '2px solid rgba(201,169,97,0.5)',
                  background: voted ? '#8FBC8F' : 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                aria-label={voted ? 'Remove vote' : 'Vote for this date'}
              >
                {voted && (
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                    <path d="M1 4l2 2 4-4" stroke="#1A0F08" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>

              <span style={{ flex: 1, fontSize: '0.875rem', color: '#E8D4B8' }}>
                {formatPollDate(opt.date)}
              </span>

              <span
                style={{
                  fontSize: '0.75rem',
                  color: count > 0 ? '#C9A961' : 'rgba(201,169,97,0.4)',
                  flexShrink: 0,
                  minWidth: '2.5rem',
                  textAlign: 'right',
                }}
              >
                {count} {count === 1 ? 'vote' : 'votes'}
              </span>

              {isGameMaster && (
                <button
                  onClick={() => handleConfirm(opt.id)}
                  disabled={!!confirming}
                  style={{
                    flexShrink: 0,
                    padding: '0.2rem 0.6rem',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    borderRadius: '0.25rem',
                    border: '1px solid rgba(201,169,97,0.6)',
                    background: 'rgba(201,169,97,0.12)',
                    color: '#C9A961',
                    cursor: 'pointer',
                  }}
                >
                  {confirming === opt.id ? '...' : 'Confirm'}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
