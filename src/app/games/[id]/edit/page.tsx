'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

interface Game {
  id: string
  name: string
  minPlayers: number
  maxPlayers: number
  playtime: number
  complexity: number | null
  yearPublished: number | null
  image: string | null
}

export default function EditGamePage() {
  const router = useRouter()
  const params = useParams()
  const gameId = params.id as string
  
  const [game, setGame] = useState<Game | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    console.log('Fetching game:', gameId)
    fetch(`/api/games/${gameId}`)
      .then(res => {
        console.log('Response status:', res.status)
        return res.json()
      })
      .then(data => {
        console.log('Game data:', data)
        setGame(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load game:', err)
        setError('Failed to load game')
        setLoading(false)
      })
  }, [gameId])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const gameData = {
      name: formData.get('name') as string,
      minPlayers: parseInt(formData.get('minPlayers') as string),
      maxPlayers: parseInt(formData.get('maxPlayers') as string),
      playtime: parseInt(formData.get('playtime') as string),
      complexity: formData.get('complexity') ? parseFloat(formData.get('complexity') as string) : null,
      yearPublished: formData.get('yearPublished') ? parseInt(formData.get('yearPublished') as string) : null,
      image: formData.get('image') as string || null,
    }

    try {
      const response = await fetch(`/api/games/${gameId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gameData),
      })

      if (response.ok) {
        router.push('/games')
        router.refresh()
      } else {
        setError('Failed to update game')
      }
    } catch (err) {
      console.error('Failed to update game:', err)
      setError('Failed to update game')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen p-8">
        <p>Loading...</p>
      </main>
    )
  }

  if (!game) {
    return (
      <main className="min-h-screen p-8">
        <p className="text-red-600">Game not found</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-4xl font-bold mb-8">Edit Game</h1>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            Game Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            defaultValue={game.name}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="minPlayers" className="block text-sm font-medium mb-1">
              Min Players *
            </label>
            <input
              type="number"
              id="minPlayers"
              name="minPlayers"
              required
              min="1"
              defaultValue={game.minPlayers}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label htmlFor="maxPlayers" className="block text-sm font-medium mb-1">
              Max Players *
            </label>
            <input
              type="number"
              id="maxPlayers"
              name="maxPlayers"
              required
              min="1"
              defaultValue={game.maxPlayers}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
        </div>

        <div>
          <label htmlFor="playtime" className="block text-sm font-medium mb-1">
            Playtime (minutes) *
          </label>
          <input
            type="number"
            id="playtime"
            name="playtime"
            required
            min="1"
            defaultValue={game.playtime}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        <div>
          <label htmlFor="complexity" className="block text-sm font-medium mb-1">
            Complexity (1-5)
          </label>
          <input
            type="number"
            id="complexity"
            name="complexity"
            step="0.1"
            min="1"
            max="5"
            defaultValue={game.complexity || ''}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        <div>
          <label htmlFor="yearPublished" className="block text-sm font-medium mb-1">
            Year Published
          </label>
          <input
            type="number"
            id="yearPublished"
            name="yearPublished"
            min="1900"
            max={new Date().getFullYear()}
            defaultValue={game.yearPublished || ''}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        <div>
          <label htmlFor="image" className="block text-sm font-medium mb-1">
            Image URL
          </label>
          <input
            type="url"
            id="image"
            name="image"
            defaultValue={game.image || ''}
            placeholder="https://..."
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/games')}
            className="px-6 py-2 border rounded-lg hover:bg-gray-100"
          >
            Cancel
          </button>
        </div>
      </form>
    </main>
  )
}