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
        className={`flex-1 px-3 py-2 text-sm rounded font-medium transition-colors ${
          status === 'yes'
            ? 'bg-green-600 text-white'
            : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
        } disabled:opacity-50`}
      >
        {loading && status === 'yes' ? '...' : 'Yes'}
      </button>
      <button
        onClick={() => handleRsvp('maybe')}
        disabled={loading}
        className={`flex-1 px-3 py-2 text-sm rounded font-medium transition-colors ${
          status === 'maybe'
            ? 'bg-yellow-500 text-white'
            : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
        } disabled:opacity-50`}
      >
        {loading && status === 'maybe' ? '...' : 'Maybe'}
      </button>
      <button
        onClick={() => handleRsvp('no')}
        disabled={loading}
        className={`flex-1 px-3 py-2 text-sm rounded font-medium transition-colors ${
          status === 'no'
            ? 'bg-gray-400 text-white'
            : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
        } disabled:opacity-50`}
      >
        {loading && status === 'no' ? '...' : 'No'}
      </button>
    </div>
  )
}
