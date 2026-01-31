'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface RsvpButtonProps {
  eventId: string
  initialStatus: 'yes' | 'no' | 'maybe' | null
}

export default function RsvpButton({ eventId, initialStatus }: RsvpButtonProps) {
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
        className="flex-1 px-3 py-2 text-sm rounded font-medium transition-all disabled:opacity-50"
        style={{
          border: status === 'yes' ? '2px solid #8FBC8F' : '2px solid rgba(201,169,97,0.5)',
          background: status === 'yes' ? 'rgba(143,188,143,0.3)' : 'rgba(201,169,97,0.1)',
          color: status === 'yes' ? '#8FBC8F' : '#C9A961',
        }}
      >
        {loading && status === 'yes' ? '...' : 'Yes'}
      </button>
      <button
        onClick={() => handleRsvp('maybe')}
        disabled={loading}
        className="flex-1 px-3 py-2 text-sm rounded font-medium transition-all disabled:opacity-50"
        style={{
          border: status === 'maybe' ? '2px solid #DAA520' : '2px solid rgba(201,169,97,0.5)',
          background: status === 'maybe' ? 'rgba(218,165,32,0.3)' : 'rgba(201,169,97,0.1)',
          color: status === 'maybe' ? '#DAA520' : '#C9A961',
        }}
      >
        {loading && status === 'maybe' ? '...' : 'Maybe'}
      </button>
      <button
        onClick={() => handleRsvp('no')}
        disabled={loading}
        className="flex-1 px-3 py-2 text-sm rounded font-medium transition-all disabled:opacity-50"
        style={{
          border: status === 'no' ? '2px solid #8B6F47' : '2px solid rgba(201,169,97,0.5)',
          background: status === 'no' ? 'rgba(139,111,71,0.3)' : 'rgba(201,169,97,0.1)',
          color: status === 'no' ? '#8B6F47' : '#C9A961',
        }}
      >
        {loading && status === 'no' ? '...' : 'No'}
      </button>
    </div>
  )
}
