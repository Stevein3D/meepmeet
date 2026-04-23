'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface AttendedButtonProps {
  eventId: string
  targetUserId: string
  initialAttended: boolean
  isOwner: boolean
}

export default function AttendedButton({ eventId, targetUserId, initialAttended, isOwner }: AttendedButtonProps) {
  const router = useRouter()
  const [attended, setAttended] = useState(initialAttended)
  const [loading, setLoading] = useState(false)

  const toggle = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/events/${eventId}/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rsvpStatus: attended ? null : 'yes',
          targetUserId,
        }),
      })
      if (res.ok) {
        setAttended(!attended)
        router.refresh()
      }
    } catch (err) {
      console.error('Failed to update attendance:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`px-3 py-1 text-sm rounded font-medium transition-all disabled:opacity-50 flex-shrink-0 toggle-btn${attended ? ' toggle-btn--green' : ''}`}
    >
      {loading ? '…' : attended ? '✓ Attended' : 'Attended'}
    </button>
  )
}
