'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface DeleteEventButtonProps {
  eventId: string
  eventTitle: string
}

export default function DeleteEventButton({ eventId, eventTitle }: DeleteEventButtonProps) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${eventTitle}"?`)) {
      return
    }

    setDeleting(true)
    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.refresh()
      } else {
        alert('Failed to delete event')
      }
    } catch (error) {
      console.error('Delete failed:', error)
      alert('Failed to delete event')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="flex-1 px-3 py-2 rounded font-medium transition-all disabled:opacity-50"
      style={{
        border: '2px solid #8B4513',
        background: 'rgba(139,69,19,0.2)',
        color: '#CD6839',
      }}
    >
      {deleting ? 'Deleting...' : 'Delete'}
    </button>
  )
}
