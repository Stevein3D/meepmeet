'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import ConfirmModal from './ConfirmModal'

interface DeleteGameButtonProps {
  gameId: string
  gameName: string
}

export default function DeleteGameButton({ gameId, gameName }: DeleteGameButtonProps) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    setDeleting(true)
    setError(null)
    try {
      const response = await fetch(`/api/games/${gameId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setConfirming(false)
        router.refresh()
      } else {
        setError('Failed to delete game. Please try again.')
      }
    } catch (error) {
      console.error('Delete failed:', error)
      setError('Failed to delete game. Please try again.')
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
          title="Delete Game"
          message={`Are you sure you want to delete "${gameName}"? This cannot be undone.`}
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
