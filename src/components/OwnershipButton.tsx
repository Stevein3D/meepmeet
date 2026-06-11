'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface OwnershipButtonProps {
  gameId: string
  initialOwned: boolean
}

export default function OwnershipButton({ gameId, initialOwned }: OwnershipButtonProps) {
  const router = useRouter()
  const [owned, setOwned] = useState(initialOwned)
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)

  const toggleOwnership = async () => {
    setLoading(true)
    setFailed(false)
    try {
      const response = await fetch(`/api/games/${gameId}/ownership`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owned: !owned }),
      })

      if (response.ok) {
        setOwned(!owned)
        router.refresh() // Refresh to update owner count
      } else {
        setFailed(true)
      }
    } catch (error) {
      console.error('Failed to toggle ownership:', error)
      setFailed(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={toggleOwnership}
      disabled={loading}
      title={failed ? 'Failed to update ownership — click to retry' : undefined}
      className={`px-3 py-2 text-sm rounded font-medium transition-all disabled:opacity-50 toggle-btn${owned ? ' toggle-btn--green' : ' toggle-btn--gold'}`}
      style={failed ? { borderColor: '#C06030', color: '#E8A070' } : undefined}
    >
      {loading ? '...' : failed ? 'Retry' : owned ? '✓ Owned' : '+ Own'}
    </button>
  )
}