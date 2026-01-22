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

  const toggleOwnership = async () => {
    setLoading(true)
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
        alert('Failed to update ownership')
      }
    } catch (error) {
      console.error('Failed to toggle ownership:', error)
      alert('Failed to update ownership')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={toggleOwnership}
      disabled={loading}
      className={`px-3 py-1 text-sm rounded border transition-colors ${
        owned
          ? 'bg-green-50 border-green-600 text-green-700 hover:bg-green-100'
          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
      } disabled:opacity-50`}
    >
      {loading ? '...' : owned ? '✓ I own this' : '+ I own this'}
    </button>
  )
}