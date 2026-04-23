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

  const handleRsvp = async (newStatus: 'yes' | 'no' | 'maybe') => {
    // If clicking the same status, remove RSVP
    const finalStatus = status === newStatus ? null : newStatus

    setLoading(true)
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
        alert('Failed to update RSVP')
      }
    } catch (error) {
      console.error('Failed to update RSVP:', error)
      alert('Failed to update RSVP')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => handleRsvp('yes')}
        disabled={loading}
        className={`flex-1 px-3 py-2 text-sm rounded font-medium transition-all disabled:opacity-50 toggle-btn${status === 'yes' ? ' toggle-btn--green' : ''}`}
      >
        {loading && status === 'yes' ? '...' : 'Yes'}
      </button>
      {!hideMaybe && (
        <button
          onClick={() => handleRsvp('maybe')}
          disabled={loading}
          className={`flex-1 px-3 py-2 text-sm rounded font-medium transition-all disabled:opacity-50 toggle-btn${status === 'maybe' ? ' toggle-btn--amber' : ''}`}
        >
          {loading && status === 'maybe' ? '...' : 'Maybe'}
        </button>
      )}
      <button
        onClick={() => handleRsvp('no')}
        disabled={loading}
        className={`flex-1 px-3 py-2 text-sm rounded font-medium transition-all disabled:opacity-50 toggle-btn${status === 'no' ? ' toggle-btn--wood' : ''}`}
      >
        {loading && status === 'no' ? '...' : 'No'}
      </button>
    </div>
  )
}
