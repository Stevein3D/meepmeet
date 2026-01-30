'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AddEventPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rsvpAsYes, setRsvpAsYes] = useState(true)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const eventData = {
      title: formData.get('title') as string,
      date: new Date(formData.get('date') as string).toISOString(),
      location: formData.get('location') as string || null,
      notes: formData.get('notes') as string || null,
      rsvpAsYes: rsvpAsYes,
    }

    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
      })

      if (response.ok) {
        router.push('/events')
        router.refresh()
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
    <main className="min-h-screen p-8">
      <h1 className="text-4xl font-bold mb-8">Create Game Night</h1>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-1">
            Event Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            required
            placeholder="Friday Game Night"
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        <div>
          <label htmlFor="date" className="block text-sm font-medium mb-1">
            Date & Time *
          </label>
          <input
            type="datetime-local"
            id="date"
            name="date"
            required
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        <div>
          <label htmlFor="location" className="block text-sm font-medium mb-1">
            Location
          </label>
          <input
            type="text"
            id="location"
            name="location"
            placeholder="123 Main St or Online"
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium mb-1">
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={4}
            placeholder="Bring snacks! We'll play Wingspan and Catan."
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="rsvpAsYes"
            checked={rsvpAsYes}
            onChange={(e) => setRsvpAsYes(e.target.checked)}
            className="w-4 h-4"
          />
          <label htmlFor="rsvpAsYes" className="text-sm font-medium">
            I'm attending
          </label>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Creating...' : 'Create Event'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/events')}
            className="px-6 py-2 border rounded-lg hover:bg-gray-100"
          >
            Cancel
          </button>
        </div>
      </form>
    </main>
  )
}
