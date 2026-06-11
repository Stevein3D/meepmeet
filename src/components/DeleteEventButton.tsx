'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import ConfirmModal from './ConfirmModal'

interface DeleteEventButtonProps {
  eventId: string
  eventTitle: string
}

export default function DeleteEventButton({ eventId, eventTitle }: DeleteEventButtonProps) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    setDeleting(true)
    setError(null)
    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setConfirming(false)
        router.refresh()
      } else {
        setError('Failed to delete event. Please try again.')
      }
    } catch (error) {
      console.error('Delete failed:', error)
      setError('Failed to delete event. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <button
        onClick={() => { setError(null); setConfirming(true) }}
        disabled={deleting}
        className="flex-1 btn btn-sm btn-danger disabled:opacity-50"
      >
        {deleting ? 'Deleting...' : 'Delete'}
      </button>

      {confirming && (
        <ConfirmModal
          title="Delete Event"
          message={`Are you sure you want to delete "${eventTitle}"? This cannot be undone.`}
          confirmLabel="Delete"
          danger
          busy={deleting}
          error={error}
          onConfirm={handleDelete}
          onCancel={() => setConfirming(false)}
        />
      )}
    </>
  )
}
