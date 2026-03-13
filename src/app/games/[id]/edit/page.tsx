'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Header from '@/components/Header'

interface Game {
  id: string
  bggId: number | null
  name: string
  minPlayers: number
  maxPlayers: number
  playtime: number
  complexity: number | null
  yearPublished: number | null
  image: string | null
  description: string | null
  mechanisms: string[]
  categories: string[]
  owners: { userId: string }[]
}

export default function EditGamePage() {
  const router = useRouter()
  const params = useParams()
  const gameId = params.id as string

  const [game, setGame] = useState<Game | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [refreshed, setRefreshed] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Controlled form state
  const [name, setName] = useState('')
  const [minPlayers, setMinPlayers] = useState('')
  const [maxPlayers, setMaxPlayers] = useState('')
  const [playtime, setPlaytime] = useState('')
  const [complexity, setComplexity] = useState('')
  const [yearPublished, setYearPublished] = useState('')
  const [image, setImage] = useState('')
  const [description, setDescription] = useState('')
  const [mechanisms, setMechanisms] = useState('') // comma-separated
  const [categories, setCategories] = useState('') // comma-separated
  const [iOwn, setIOwn] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch(`/api/games/${gameId}`).then(r => r.json()),
      fetch('/api/user/current').then(r => r.json()),
    ])
      .then(([gameData, userData]: [Game, { userId: string }]) => {
        setGame(gameData)
        setName(gameData.name)
        setMinPlayers(String(gameData.minPlayers))
        setMaxPlayers(String(gameData.maxPlayers))
        setPlaytime(String(gameData.playtime))
        setComplexity(gameData.complexity != null ? Number(gameData.complexity).toFixed(1) : '')
        setYearPublished(gameData.yearPublished != null ? String(gameData.yearPublished) : '')
        setImage(gameData.image ?? '')
        setDescription(gameData.description ?? '')
        setMechanisms((gameData.mechanisms ?? []).join(', '))
        setCategories((gameData.categories ?? []).join(', '))
        setIOwn(gameData.owners.some(o => o.userId === userData.userId))
        setLoading(false)
      })
      .catch(() => {
        setError('Failed to load game')
        setLoading(false)
      })
  }, [gameId])

  const applyBggData = (bggData: {
    name: string
    image: string
    description: string
    mechanisms: string[]
    categories: string[]
    minPlayers: number
    maxPlayers: number
    playingTime: number
    averageWeight: number
    yearPublished: number
  }) => {
    setName(bggData.name)
    setImage(bggData.image ?? '')
    setDescription(bggData.description ?? '')
    setMechanisms((bggData.mechanisms ?? []).join(', '))
    setCategories((bggData.categories ?? []).join(', '))
    setMinPlayers(String(bggData.minPlayers))
    setMaxPlayers(String(bggData.maxPlayers))
    setPlaytime(String(bggData.playingTime))
    setComplexity(bggData.averageWeight ? Number(bggData.averageWeight).toFixed(1) : '')
    setYearPublished(bggData.yearPublished ? String(bggData.yearPublished) : '')
  }

  const handleRefreshFromBGG = async () => {
    if (!game?.bggId) return
    setRefreshing(true)
    setRefreshed(false)
    setError(null)
    try {
      const res = await fetch(`/api/bgg/game/${game.bggId}`)
      if (!res.ok) throw new Error('BGG fetch failed')
      const bggData = await res.json()
      applyBggData(bggData)
      setRefreshed(true)
      setTimeout(() => setRefreshed(false), 3000)
    } catch {
      setError('Failed to fetch data from BGG')
    } finally {
      setRefreshing(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const payload = {
      name,
      minPlayers: parseInt(minPlayers),
      maxPlayers: parseInt(maxPlayers),
      playtime: parseInt(playtime),
      complexity: complexity ? parseFloat(complexity) : null,
      yearPublished: yearPublished ? parseInt(yearPublished) : null,
      image: image || null,
      description: description || null,
      mechanisms: mechanisms
        ? mechanisms.split(',').map(m => m.trim()).filter(Boolean)
        : [],
      categories: categories
        ? categories.split(',').map(c => c.trim()).filter(Boolean)
        : [],
      iOwn,
    }

    try {
      const res = await fetch(`/api/games/${gameId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        router.push('/games')
        router.refresh()
      } else {
        setError('Failed to update game')
      }
    } catch {
      setError('Failed to update game')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <main className="flex-1 p-8"><p>Loading...</p></main>
  if (!game) return <main className="flex-1 p-8"><p className="text-red-600">Game not found</p></main>

  return (
    <>
      <Header />
      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-8 max-w-2xl">
          <h1 className="text-4xl font-bold">Edit Game</h1>
          {game.bggId && (
            <button
              type="button"
              onClick={handleRefreshFromBGG}
              disabled={refreshing}
              className="btn btn-sm btn-secondary disabled:opacity-50"
            >
              {refreshing ? 'Refreshing…' : refreshed ? '✓ Refreshed' : '↻ Refresh from BGG'}
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg max-w-2xl">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
          <div className="wood-panel space-y-4">

            <div className="field-group">
              <label htmlFor="name" className="block text-sm font-medium mb-1">Game Name *</label>
              <input
                type="text" id="name" required
                value={name} onChange={e => setName(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="field-group">
                <label htmlFor="minPlayers" className="block text-sm font-medium mb-1">Min Players *</label>
                <input
                  type="number" id="minPlayers" required min="1"
                  value={minPlayers} onChange={e => setMinPlayers(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div className="field-group">
                <label htmlFor="maxPlayers" className="block text-sm font-medium mb-1">Max Players *</label>
                <input
                  type="number" id="maxPlayers" required min="1"
                  value={maxPlayers} onChange={e => setMaxPlayers(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
            </div>

            <div className="field-group">
              <label htmlFor="playtime" className="block text-sm font-medium mb-1">Playtime (minutes) *</label>
              <input
                type="number" id="playtime" required min="1"
                value={playtime} onChange={e => setPlaytime(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>

            <div className="field-group">
              <label htmlFor="complexity" className="block text-sm font-medium mb-1">Complexity (1–5)</label>
              <input
                type="number" id="complexity" step="0.1" min="1" max="5"
                value={complexity} onChange={e => setComplexity(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>

            <div className="field-group">
              <label htmlFor="yearPublished" className="block text-sm font-medium mb-1">Year Published</label>
              <input
                type="number" id="yearPublished" min="1900" max={new Date().getFullYear()}
                value={yearPublished} onChange={e => setYearPublished(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>

            <div className="field-group">
              <label htmlFor="image" className="block text-sm font-medium mb-1">Image URL</label>
              <input
                type="url" id="image" placeholder="https://…"
                value={image} onChange={e => setImage(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>

            <div className="field-group">
              <label htmlFor="categories" className="block text-sm font-medium mb-1">
                Categories <span className="font-normal opacity-60">(comma-separated)</span>
              </label>
              <input
                type="text" id="categories"
                placeholder="e.g. Fantasy, Card Game"
                value={categories} onChange={e => setCategories(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>

            <div className="field-group">
              <label htmlFor="mechanisms" className="block text-sm font-medium mb-1">
                Mechanisms <span className="font-normal opacity-60">(comma-separated)</span>
              </label>
              <input
                type="text" id="mechanisms"
                placeholder="e.g. Deck Building, Area Control"
                value={mechanisms} onChange={e => setMechanisms(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>

            <div className="field-group">
              <label htmlFor="description" className="block text-sm font-medium mb-1">Description</label>
              <textarea
                id="description" rows={5}
                placeholder="Game description…"
                value={description} onChange={e => setDescription(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg resize-y"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox" id="iOwn"
                checked={iOwn} onChange={e => setIOwn(e.target.checked)}
                className="w-4 h-4 accent-[#C9A961]"
              />
              <label htmlFor="iOwn" className="text-sm font-medium">I own this game</label>
            </div>

          </div>

          <div className="flex gap-4">
            <button type="submit" disabled={saving} className="btn btn-md btn-primary disabled:opacity-50">
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
            <button type="button" onClick={() => router.push('/games')} className="btn btn-md btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </main>
    </>
  )
}
