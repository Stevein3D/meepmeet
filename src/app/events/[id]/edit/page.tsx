'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Header from '@/components/Header'

interface EventData {
  id: string
  title: string
  date: string
  location: string | null
  notes: string | null
  hostId: string
  dateConfirmed: boolean
}

interface PollOption {
  id: string
  date: string
  confirmedAt: string | null
  votes: { userId: string }[]
}

interface GameMaster {
  id: string
  name: string
}

function formatPollDate(date: string) {
  return new Date(date).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/New_York',
  })
}

export default function EditEventPage() {
  const router = useRouter()
  const params = useParams()
  const eventId = params.id as string

  const [event, setEvent] = useState<EventData | null>(null)
  const [gameMasters, setGameMasters] = useState<GameMaster[]>([])
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Poll state
  const [pollOptions, setPollOptions] = useState<PollOption[]>([])
  const [newPollDate, setNewPollDate] = useState('')
  const [addingPoll, setAddingPoll] = useState(false)
  const [pollBusy, setPollBusy] = useState(false)
  const [notifying, setNotifying] = useState(false)
  const [notified, setNotified] = useState(false)
  const [testNotifying, setTestNotifying] = useState(false)
  const [testNotified, setTestNotified] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch(`/api/events/${eventId}`).then(res => res.json()),
      fetch('/api/user/profile').then(res => res.json()),
      fetch('/api/admin/users').then(res => res.json()),
      fetch(`/api/events/${eventId}/poll`).then(res => res.json()),
    ])
      .then(([eventData, currentUser, allUsers, pollData]) => {
        const isHost = eventData.hostId === currentUser.id
        const isGameMaster = currentUser.role === 'GAME_MASTER'

        if (!isHost && !isGameMaster) {
          router.push('/events')
          return
        }

        setEvent(eventData)
        setCurrentUserRole(currentUser.role)
        setPollOptions(Array.isArray(pollData) ? pollData : [])

        if (isGameMaster) {
          setGameMasters(allUsers.filter((u: { role: string; id: string; name: string }) => u.role === 'GAME_MASTER'))
        }

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
    const payload: Record<string, string | null> = {
      title: formData.get('title') as string,
      date: new Date(formData.get('date') as string).toISOString(),
      location: (formData.get('location') as string) || null,
      notes: (formData.get('notes') as string) || null,
    }

    if (currentUserRole === 'GAME_MASTER') {
      payload.hostId = formData.get('hostId') as string
    }

    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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

  const handleAddPollOption = async () => {
    if (!newPollDate) return
    setPollBusy(true)
    const res = await fetch(`/api/events/${eventId}/poll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: new Date(newPollDate).toISOString() }),
    })
    if (res.ok) {
      const option = await res.json()
      setPollOptions(prev => [...prev, option])
      setNewPollDate('')
      setAddingPoll(false)
    }
    setPollBusy(false)
  }

  const handleNotifyMembers = async () => {
    if (!confirm('Send a poll notification email to all members? This cannot be undone.')) return
    setNotifying(true)
    await fetch(`/api/events/${eventId}/poll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'notify' }),
    })
    setNotifying(false)
    setNotified(true)
  }

  const handleTestNotify = async () => {
    setTestNotifying(true)
    await fetch(`/api/events/${eventId}/poll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'test-notify' }),
    })
    setTestNotifying(false)
    setTestNotified(true)
    setTimeout(() => setTestNotified(false), 4000)
  }

  const handleDeletePollOption = async (optionId: string) => {
    setPollBusy(true)
    const res = await fetch(`/api/events/${eventId}/poll`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ optionId }),
    })
    if (res.ok) {
      setPollOptions(prev => prev.filter(o => o.id !== optionId))
    }
    setPollBusy(false)
  }

  const handleConfirmDate = async (optionId: string) => {
    if (!confirm('Confirm this date? This will set the event date and notify all members.')) return
    setPollBusy(true)
    const res = await fetch(`/api/events/${eventId}/poll/${optionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'confirm' }),
    })
    if (res.ok) {
      const { date } = await res.json()
      setEvent(prev => prev ? { ...prev, dateConfirmed: true, date } : prev)
    }
    setPollBusy(false)
  }

  const formatDateTimeLocal = (isoString: string) => {
    const date = new Date(isoString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.5rem 0.75rem',
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid rgba(201,169,97,0.4)',
    borderRadius: '0.375rem',
    color: '#E8D4B8',
    outline: 'none',
    fontSize: '0.9rem',
  }

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen p-8"><p>Loading...</p></main>
      </>
    )
  }

  if (!event) {
    return (
      <>
        <Header />
        <main className="min-h-screen p-8">
          <p style={{ color: '#c06060' }}>{error ?? 'Event not found'}</p>
        </main>
      </>
    )
  }

  return (
    <>
      <Header />
      <main className="min-h-screen p-8" style={{ color: '#F5E6D3' }}>
        <h1 className="text-4xl font-bold mb-8">Edit Event</h1>

        {error && (
          <div className="mb-4 p-4 rounded-lg" style={{ background: 'rgba(192,96,48,0.2)', border: '1px solid rgba(192,96,48,0.5)', color: '#E8A070' }}>
            {error}
          </div>
        )}

        <div className="max-w-2xl space-y-6">
          {/* Event details form */}
          <form onSubmit={handleSubmit}>
            <div className="wood-panel mb-4 space-y-4">
              <div className="field-group">
                <label htmlFor="title" className="block text-sm font-medium mb-1" style={{ color: '#C9A961' }}>
                  Event Title *
                </label>
                <input type="text" id="title" name="title" required defaultValue={event.title} style={inputStyle} />
              </div>

              <div className="field-group">
                <label htmlFor="date" className="block text-sm font-medium mb-1" style={{ color: '#C9A961' }}>
                  Date & Time *
                  {event.dateConfirmed && (
                    <span style={{ marginLeft: '0.5rem', fontSize: '0.7rem', color: '#8FBC8F', fontWeight: 400 }}>
                      ✓ Confirmed
                    </span>
                  )}
                </label>
                <input
                  type="datetime-local"
                  id="date"
                  name="date"
                  required
                  defaultValue={formatDateTimeLocal(event.date)}
                  style={inputStyle}
                />
              </div>

              <div className="field-group">
                <label htmlFor="location" className="block text-sm font-medium mb-1" style={{ color: '#C9A961' }}>
                  Location
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  defaultValue={event.location || ''}
                  placeholder="123 Main St or Online"
                  style={inputStyle}
                />
              </div>

              {currentUserRole === 'GAME_MASTER' && gameMasters.length > 0 && (
                <div className="field-group">
                  <label htmlFor="hostId" className="block text-sm font-medium mb-1" style={{ color: '#C9A961' }}>
                    Host
                  </label>
                  <select id="hostId" name="hostId" defaultValue={event.hostId} style={{ ...inputStyle, cursor: 'pointer' }}>
                    {gameMasters.map(gm => (
                      <option key={gm.id} value={gm.id}>{gm.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="field-group">
                <label htmlFor="notes" className="block text-sm font-medium mb-1" style={{ color: '#C9A961' }}>
                  Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={4}
                  defaultValue={event.notes || ''}
                  placeholder="Bring snacks! We'll play Wingspan and Catan."
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="btn btn-md btn-primary disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button type="button" onClick={() => router.push('/events')} className="btn btn-md btn-secondary">
                Cancel
              </button>
            </div>
          </form>

          {/* Date Poll section */}
          <div className="wood-panel">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#C9A961' }}>
                Date Poll
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {!event.dateConfirmed && pollOptions.length > 0 && (
                  <>
                    <button
                      onClick={handleTestNotify}
                      disabled={testNotifying}
                      style={{
                        padding: '0.25rem 0.7rem',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        borderRadius: '0.25rem',
                        border: '1px solid rgba(201,169,97,0.25)',
                        background: testNotified ? 'rgba(143,188,143,0.1)' : 'rgba(0,0,0,0.2)',
                        color: testNotified ? '#8FBC8F' : 'rgba(201,169,97,0.5)',
                        cursor: testNotifying ? 'default' : 'pointer',
                      }}
                    >
                      {testNotifying ? 'Sending...' : testNotified ? '✓ Test sent' : 'Test Email'}
                    </button>
                    <button
                      onClick={handleNotifyMembers}
                      disabled={notifying || notified}
                      style={{
                        padding: '0.25rem 0.7rem',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        borderRadius: '0.25rem',
                        border: '1px solid rgba(201,169,97,0.5)',
                        background: notified ? 'rgba(143,188,143,0.15)' : 'rgba(201,169,97,0.1)',
                        color: notified ? '#8FBC8F' : '#C9A961',
                        cursor: notified ? 'default' : 'pointer',
                      }}
                    >
                      {notifying ? 'Sending...' : notified ? '✓ Members notified' : 'Notify Members'}
                    </button>
                  </>
                )}
                {event.dateConfirmed && (
                  <span style={{ fontSize: '0.75rem', color: '#8FBC8F', fontWeight: 600 }}>✓ Date confirmed</span>
                )}
              </div>
            </div>

            {!event.dateConfirmed && pollOptions.length === 0 && (
              <p style={{ fontSize: '0.85rem', color: 'rgba(232,212,184,0.5)', marginBottom: '0.75rem' }}>
                Add date options for members to vote on, then notify them when ready.
              </p>
            )}

            {pollOptions.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.75rem' }}>
                {pollOptions.map(opt => (
                  <div
                    key={opt.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.45rem 0.75rem',
                      borderRadius: '0.375rem',
                      background: opt.confirmedAt ? 'rgba(143,188,143,0.12)' : 'rgba(201,169,97,0.06)',
                      border: opt.confirmedAt ? '1px solid #8FBC8F' : '1px solid rgba(201,169,97,0.2)',
                    }}
                  >
                    <span style={{ flex: 1, fontSize: '0.875rem', color: '#E8D4B8' }}>
                      {formatPollDate(opt.date)}
                      {opt.confirmedAt && (
                        <span style={{ marginLeft: '0.4rem', fontSize: '0.7rem', color: '#8FBC8F' }}>✓ confirmed</span>
                      )}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: opt.votes.length > 0 ? '#C9A961' : 'rgba(201,169,97,0.4)', flexShrink: 0 }}>
                      {opt.votes.length} {opt.votes.length === 1 ? 'vote' : 'votes'}
                    </span>
                    {!event.dateConfirmed && (
                      <button
                        onClick={() => handleConfirmDate(opt.id)}
                        disabled={pollBusy}
                        style={{
                          padding: '0.2rem 0.55rem',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          borderRadius: '0.25rem',
                          border: '1px solid rgba(143,188,143,0.5)',
                          background: 'rgba(143,188,143,0.1)',
                          color: '#8FBC8F',
                          cursor: 'pointer',
                          flexShrink: 0,
                        }}
                      >
                        Confirm
                      </button>
                    )}
                    {!event.dateConfirmed && (
                      <button
                        onClick={() => handleDeletePollOption(opt.id)}
                        disabled={pollBusy}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'rgba(201,169,97,0.4)',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          padding: '0',
                          flexShrink: 0,
                        }}
                        aria-label="Remove option"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {!event.dateConfirmed && (
              addingPoll ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <input
                    type="datetime-local"
                    value={newPollDate}
                    onChange={e => setNewPollDate(e.target.value)}
                    style={{ ...inputStyle, width: 'auto' }}
                  />
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={handleAddPollOption}
                      disabled={pollBusy || !newPollDate}
                      className="btn btn-md btn-primary disabled:opacity-50"
                    >
                      {pollBusy ? 'Adding...' : 'Add Option'}
                    </button>
                    <button
                      onClick={() => { setAddingPoll(false); setNewPollDate('') }}
                      className="btn btn-md btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setAddingPoll(true)}
                  style={{
                    background: 'none',
                    border: '1px dashed rgba(201,169,97,0.4)',
                    borderRadius: '0.375rem',
                    color: 'rgba(201,169,97,0.7)',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    padding: '0.4rem 0.75rem',
                    width: '100%',
                    textAlign: 'left',
                  }}
                >
                  + Add date option
                </button>
              )
            )}
          </div>
        </div>
      </main>
    </>
  )
}
