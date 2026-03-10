'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import { 
  MemberOnly, 
  GameMasterOnly, 
  CanAddGames, 
  CanCreateEvents 
} from '@/components/RoleGuard';

interface BGGSearchResult {
  id: number
  name: string
  yearPublished: number
}

export default function AddGamePage() {
  const router = useRouter()
  const [mode, setMode] = useState<'manual' | 'search'>('manual')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [iOwn, setIOwn] = useState(true)
  
  // BGG search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<BGGSearchResult[]>([])
  const [addingGameId, setAddingGameId] = useState<number | null>(null)
  const [ownedGames, setOwnedGames] = useState<Record<number, boolean>>({}) // Track ownership per game

  const handleManualSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
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
      iOwn: iOwn,
    }

    try {
      const response = await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gameData),
      })

      if (response.ok) {
        router.push('/games')
        router.refresh()
      } else {
        setError('Failed to add game')
      }
    } catch (err) {
      console.error('Failed to add game:', err)
      setError('Failed to add game')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    
    setSearching(true)
    setError(null)
    setOwnedGames({}) // Reset ownership tracking on new search
    try {
      const response = await fetch(`/api/bgg/search?query=${encodeURIComponent(searchQuery)}`)
      if (!response.ok) throw new Error('Search failed')
      
      const results = await response.json()
      setSearchResults(results)
      if (results.length === 0) {
        setError('No games found')
      }
    } catch (err) {
      console.error('Search failed:', err)
      setError('Failed to search BGG')
    } finally {
      setSearching(false)
    }
  }

  const handleAddFromBGG = async (bggId: number, shouldOwn: boolean) => {
    setAddingGameId(bggId)
    setError(null)
    try {
      const detailsResponse = await fetch(`/api/bgg/game/${bggId}`)
      if (!detailsResponse.ok) throw new Error('Failed to fetch game details')
      
      const gameDetails = await detailsResponse.json()

      const response = await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bggId: gameDetails.id,
          name: gameDetails.name,
          image: gameDetails.image,
          minPlayers: gameDetails.minPlayers,
          maxPlayers: gameDetails.maxPlayers,
          playtime: gameDetails.playingTime,
          complexity: gameDetails.averageWeight,
          yearPublished: gameDetails.yearPublished,
          iOwn: shouldOwn,
        }),
      })

      if (response.ok) {
        router.push('/games')
        router.refresh()
      } else {
        setError('Failed to add game to database')
      }
    } catch (err) {
      console.error('Failed to add game:', err)
      setError('Failed to add game')
    } finally {
      setAddingGameId(null)
    }
  }

  const toggleGameOwnership = (gameId: number) => {
    setOwnedGames(prev => ({
      ...prev,
      [gameId]: !prev[gameId]
    }))
  }

  return (
    <>
    <Header />
    <main className="min-h-screen p-8">
      <h1 className="text-4xl font-bold mb-8">Add Game</h1>

      {/* Mode Toggle */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setMode('manual')}
          className={`btn btn-md ${
            mode === 'manual'
              ? 'btn-primary'
              : 'btn-success'
          }`}
        >
          Manual Entry
        </button>
        <MemberOnly>
        <button
          onClick={() => setMode('search')}
          className={`btn btn-md ${
            mode === 'search'
              ? 'btn-primary'
              : 'btn-success'
          }`}
        >
          Search BGG
        </button>
        </MemberOnly>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {mode === 'search' ? (
        <>
          <form onSubmit={handleSearch} className="mb-8">
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for a game..."
                className="flex-1 px-4 py-2 border rounded-lg"
              />
              <button
                type="submit"
                disabled={searching}
                className="btn btn-sm btn-primary"
              >
                {searching ? 'Searching...' : 'Search'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/games')}
                className="btn btn-sm btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>

          {searchResults.length > 0 && (
            <div className="space-y-2">
              {searchResults.map((game) => (
                <div
                  key={game.id}
                  className="flex items-center justify-between border rounded-lg p-4"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold">{game.name}</h3>
                    <p className="text-sm font-medium parchment-text">
                      {game.yearPublished || 'Year unknown'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={ownedGames[game.id] || false}
                        onChange={() => toggleGameOwnership(game.id)}
                        className="w-4 h-4 accent-[#C9A961]"
                      />
                      I own this
                    </label>
                    <button
                      onClick={() => handleAddFromBGG(game.id, ownedGames[game.id] || false)}
                      disabled={addingGameId !== null}
                      className={`btn btn-sm ${
                        addingGameId === game.id
                          ? 'btn-success cursor-wait'
                          : addingGameId !== null
                          ? 'btn-success opacity-50 cursor-not-allowed'
                          : 'btn-success hover:bg-green-700'
                      }`}
                    >
                      {addingGameId === game.id ? 'Adding...' : 'Add'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <form onSubmit={handleManualSubmit} className="max-w-2xl space-y-4">
          <div className='wood-panel mb-6 space-y-4'>
            <div className="field-group">
              <label htmlFor="name" className="block text-sm font-medium mb-1">
                Game Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="field-group">
                <label htmlFor="minPlayers" className="block text-sm font-medium mb-1">
                  Min Players *
                </label>
                <input
                  type="number"
                  id="minPlayers"
                  name="minPlayers"
                  required
                  min="1"
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              <div className="field-group">
                <label htmlFor="maxPlayers" className="block text-sm font-medium mb-1">
                  Max Players *
                </label>
                <input
                  type="number"
                  id="maxPlayers"
                  name="maxPlayers"
                  required
                  min="1"
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
            </div>

            <div className="field-group">
              <label htmlFor="playtime" className="block text-sm font-medium mb-1">
                Playtime (minutes) *
              </label>
              <input
                type="number"
                id="playtime"
                name="playtime"
                required
                min="1"
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>

            <div className="field-group">
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
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>

            <div className="field-group">
              <label htmlFor="yearPublished" className="block text-sm font-medium mb-1">
                Year Published
              </label>
              <input
                type="number"
                id="yearPublished"
                name="yearPublished"
                min="1900"
                max={new Date().getFullYear()}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>

            <div className="field-group">
              <label htmlFor="image" className="block text-sm font-medium mb-1">
                Image URL
              </label>
              <input
                type="url"
                id="image"
                name="image"
                placeholder="https://..."
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="iOwn"
                checked={iOwn}
                onChange={(e) => setIOwn(e.target.checked)}
                className="w-4 h-4 accent-[#C9A961]"
              />
              <label htmlFor="iOwn" className="text-sm font-medium">
                I own this game
              </label>
            </div>

          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="btn btn-md btn-primary disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Game'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/games')}
              className="btn btn-md btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </main>
    </>
  )
}