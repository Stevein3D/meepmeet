'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

interface Event {
  id: string
  title: string
  date: string
  location: string | null
  notes: string | null
  hostId: string
}

export default function EditEventPage() {
  const router = useRouter()
  const params = useParams()
  const eventId = params.id as string

  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Fetch event data and current user
    Promise.all([
      fetch(`/api/events/${eventId}`).then(res => res.json()),
      fetch('/api/user/current').then(res => res.json()),
    ])
      .then(([eventData, userData]) => {
        // Check if user is the host
        if (eventData.hostId !== userData.userId) {
          router.push('/events')
          return
        }
        setEvent(eventData)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load:', err)
        setError('Failed to load event')
        setLoading(false)
      })
  }, [eventId, router])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const eventData = {
      title: formData.get('title') as string,
      date: new Date(formData.get('date') as string).toISOString(),
      location: formData.get('location') as string || null,
      notes: formData.get('notes') as string || null,
    }

    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
      })

      if (response.ok) {
        router.push('/events')
        router.refresh()
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to update event')
      }
    } catch (err) {
      console.error('Failed to update event:', err)
      setError('Failed to update event')
    } finally {
      setSaving(false)
    }
  }

  // Convert ISO date to datetime-local format (YYYY-MM-DDThh:mm)
  const formatDateTimeLocal = (isoString: string) => {
    const date = new Date(isoString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  if (loading) {
    return (
      <main className="min-h-screen p-8">
        <p>Loading...</p>
      </main>
    )
  }

  if (!event) {
    return (
      <main className="min-h-screen p-8">
        <p className="text-red-600">Event not found</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-4xl font-bold mb-8">Edit Event</h1>

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
            defaultValue={event.title}
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
            defaultValue={formatDateTimeLocal(event.date)}
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
            defaultValue={event.location || ''}
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
            defaultValue={event.notes || ''}
            placeholder="Bring snacks! We'll play Wingspan and Catan."
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
