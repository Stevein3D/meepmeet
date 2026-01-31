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
      className="px-3 py-2 text-sm rounded font-medium transition-all disabled:opacity-50"
      style={{
        border: owned ? '2px solid #8FBC8F' : '2px solid #C9A961',
        background: owned ? 'rgba(143,188,143,0.2)' : 'rgba(201,169,97,0.1)',
        color: owned ? '#8FBC8F' : '#C9A961',
      }}
    >
      {loading ? '...' : owned ? '✓ I own this' : '+ I own this'}
    </button>
  )
}