'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface DeleteGameButtonProps {
  gameId: string
  gameName: string
}

export default function DeleteGameButton({ gameId, gameName }: DeleteGameButtonProps) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${gameName}"?`)) {
      return
    }

    setDeleting(true)
    try {
      const response = await fetch(`/api/games/${gameId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.refresh()
      } else {
        alert('Failed to delete game')
      }
    } catch (error) {
      console.error('Delete failed:', error)
      alert('Failed to delete game')
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