'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface RsvpButtonProps {
  eventId: string
  initialStatus: 'yes' | 'no' | 'maybe' | null
  hideMaybe?: boolean
}

export default function RsvpButton({ eventId, initialStatus, hideMaybe = false }: RsvpButtonProps) {
  const router = useRouter()
  const [status, setStatus] = useState<'yes' | 'no' | 'maybe' | null>(initialStatus)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  const handleRsvp = async (newStatus: 'yes' | 'no' | 'maybe') => {
    // If clicking the same status, remove RSVP
    const finalStatus = status === newStatus ? null : newStatus

    setLoading(true)
    setError(false)
    try {
      const response = await fetch(`/api/events/${eventId}/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rsvpStatus: finalStatus }),
      })

      if (response.ok) {
        setStatus(finalStatus)
        router.refresh()
      } else {
        setError(true)
      }
    } catch (err) {
      console.error('Failed to update RSVP:', err)
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {error && (
        <p style={{ fontSize: '0.75rem', color: '#E8A070', margin: '0 0 0.4rem' }}>
          Failed to update RSVP — please try again.
        </p>
      )}
      <div className="rsvp-group">
        <button
          onClick={() => handleRsvp('yes')}
          disabled={loading}
          aria-pressed={status === 'yes'}
          className={`rsvp-segment${status === 'yes' ? ' rsvp-segment--yes' : ''}`}
        >
          {loading && status === 'yes' ? '…' : status === 'yes' ? '✓ Yes' : 'Yes'}
        </button>
        {!hideMaybe && (
          <button
            onClick={() => handleRsvp('maybe')}
            disabled={loading}
            aria-pressed={status === 'maybe'}
            className={`rsvp-segment${status === 'maybe' ? ' rsvp-segment--maybe' : ''}`}
          >
            {loading && status === 'maybe' ? '…' : status === 'maybe' ? '✓ Maybe' : 'Maybe'}
          </button>
        )}
        <button
          onClick={() => handleRsvp('no')}
          disabled={loading}
          aria-pressed={status === 'no'}
          className={`rsvp-segment${status === 'no' ? ' rsvp-segment--no' : ''}`}
        >
          {loading && status === 'no' ? '…' : status === 'no' ? '✓ No' : 'No'}
        </button>
      </div>
    </div>
  )
}
