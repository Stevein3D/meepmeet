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
      className="px-3 py-1 text-sm rounded font-medium transition-all disabled:opacity-50 flex-shrink-0"
      style={{
        border: attended ? '2px solid #8FBC8F' : '2px solid rgba(201,169,97,0.5)',
        background: attended ? 'rgba(143,188,143,0.2)' : 'rgba(201,169,97,0.08)',
        color: attended ? '#8FBC8F' : 'rgba(201,169,97,0.7)',
      }}
    >
      {loading ? '…' : attended ? '✓ Attended' : 'Attended'}
    </button>
  )
}
