'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'

interface GameMaster {
  id: string
  name: string
}

export default function AddEventPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rsvpAsYes, setRsvpAsYes] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isGameMaster, setIsGameMaster] = useState(false)
  const [gameMasters, setGameMasters] = useState<GameMaster[]>([])
  const [selectedHostId, setSelectedHostId] = useState<string>('')

  useEffect(() => {
    Promise.all([
      fetch('/api/user/profile').then(r => r.json()),
      fetch('/api/admin/users').then(r => r.json()),
    ]).then(([profile, allUsers]) => {
      setCurrentUserId(profile.id)
      setSelectedHostId(profile.id)
      if (profile.role === 'GAME_MASTER') {
        setIsGameMaster(true)
        setGameMasters(allUsers.filter((u: { role: string; id: string; name: string }) => u.role === 'GAME_MASTER'))
      }
    }).catch(console.error)
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const eventData: Record<string, unknown> = {
      title: formData.get('title') as string,
      date: new Date(formData.get('date') as string).toISOString(),
      location: formData.get('location') as string || null,
      notes: formData.get('notes') as string || null,
      rsvpAsYes,
    }

    if (isGameMaster && selectedHostId && selectedHostId !== currentUserId) {
      eventData.hostId = selectedHostId
    }

    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
      })

      if (response.ok) {
        const created = await response.json()
        router.push(`/events/${created.id}/edit`)
      } else {
        setError('Failed to create event')
      }
    } catch (err) {
      console.error('Failed to create event:', err)
      setError('Failed to create event')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
    <Header />
    <main className="min-h-screen p-8">
      <h1 className="text-4xl font-bold text-white-700 mb-8">Create Game Night</h1>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="wood-panel space-y-4 mb-6">
          <div className="field-group">
            <label htmlFor="title">Event Title *</label>
            <input type="text" id="title" name="title" required placeholder="Friday Game Night" />
          </div>

          <div className="field-group">
            <label htmlFor="date">Date & Time *</label>
            <input type="datetime-local" id="date" name="date" required />
          </div>

          <div className="field-group">
            <label htmlFor="location">Location</label>
            <input type="text" id="location" name="location" placeholder="123 Main St or Online" />
          </div>

          {isGameMaster && gameMasters.length > 0 && (
            <div className="field-group">
              <label htmlFor="hostId">Host</label>
              <select
                id="hostId"
                value={selectedHostId}
                onChange={(e) => setSelectedHostId(e.target.value)}
              >
                {gameMasters.map(gm => (
                  <option key={gm.id} value={gm.id}>
                    {gm.name}{gm.id === currentUserId ? ' (you)' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="field-group">
            <label htmlFor="notes">Notes</label>
            <textarea id="notes" name="notes" rows={4} placeholder="Bring snacks! We'll play Wingspan and Catan." />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="rsvpAsYes"
              checked={rsvpAsYes}
              onChange={(e) => setRsvpAsYes(e.target.checked)}
              className="w-4 h-4 accent-[#C9A961]"
            />
            <label htmlFor="rsvpAsYes" style={{ textTransform: 'none', letterSpacing: 'normal', fontSize: '0.9rem' }}>
              I&apos;m attending
            </label>
          </div>
        </div>

        <div className="flex gap-4">
          <button type="submit" disabled={loading} className="btn btn-md btn-primary disabled:opacity-50">
            {loading ? 'Creating...' : 'Create Event'}
          </button>
          <button type="button" onClick={() => router.push('/events')} className="btn btn-md btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </main>
    </>
  )
}
