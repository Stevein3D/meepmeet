'use client'

import { useState } from 'react'

interface Guest {
  id: string
  name: string
  bringerId: string
  bringer: { id: string; name: string; alias: string | null }
}

interface EventGuestSectionProps {
  eventId: string
  guests: Guest[]
  currentUserId: string
  userRsvpStatus: 'yes' | 'maybe' | 'no' | null
  isGameMaster: boolean
}

export default function EventGuestSection({
  eventId,
  guests: initial,
  currentUserId,
  userRsvpStatus,
  isGameMaster,
}: EventGuestSectionProps) {
  const [guests, setGuests] = useState(initial)
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)

  const canAddGuest = userRsvpStatus === 'yes' || userRsvpStatus === 'maybe'
  const myGuests = guests.filter(g => g.bringerId === currentUserId)

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setBusy(true)
    const res = await fetch(`/api/events/${eventId}/guests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim() }),
    })
    if (res.ok) {
      const guest = await res.json()
      setGuests(prev => [...prev, guest])
      setName('')
      setAdding(false)
    }
    setBusy(false)
  }

  const handleRemove = async (guestId: string) => {
    setBusy(true)
    const res = await fetch(`/api/events/${eventId}/guests`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guestId }),
    })
    if (res.ok) {
      setGuests(prev => prev.filter(g => g.id !== guestId))
    }
    setBusy(false)
  }

  // Group all guests by bringer for display
  const guestsByBringer = guests.reduce<Record<string, { bringer: Guest['bringer']; names: string[] }>>(
    (acc, g) => {
      if (!acc[g.bringerId]) acc[g.bringerId] = { bringer: g.bringer, names: [] }
      acc[g.bringerId].names.push(g.name)
      return acc
    },
    {}
  )

  const totalGuests = guests.length

  if (totalGuests === 0 && !canAddGuest) return null

  return (
    <div className="mt-3">
      {/* Summary line — shown when there are guests */}
      {totalGuests > 0 && (
        <div style={{ fontSize: '0.8rem', color: 'rgba(232,212,184,0.6)', marginBottom: '0.4rem' }}>
          {Object.values(guestsByBringer).map(({ bringer, names }, i) => (
            <span key={bringer.id}>
              <span style={{ color: 'rgba(201,169,97,0.7)' }}>{bringer.alias || bringer.name}</span>
              {' +'}
              {names.join(', ')}
              {i < Object.keys(guestsByBringer).length - 1 ? ' · ' : ''}
            </span>
          ))}
        </div>
      )}

      {/* My guests management */}
      {canAddGuest && (
        <div>
          {myGuests.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '0.4rem' }}>
              {myGuests.map(g => (
                <div key={g.id} className="flex items-center gap-2">
                  <span style={{ fontSize: '0.8rem', color: '#E8D4B8' }}>+1 {g.name}</span>
                  <button
                    onClick={() => handleRemove(g.id)}
                    disabled={busy}
                    className="btn-icon-ghost text-xs"
                    aria-label="Remove guest"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {adding ? (
            <form onSubmit={handleAdd} style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Guest name"
                autoFocus
                className="guest-inline-input"
              />
              <button
                type="submit"
                disabled={busy || !name.trim()}
                className="guest-inline-submit"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => { setAdding(false); setName('') }}
                className="btn-icon-ghost text-sm"
              >
                ✕
              </button>
            </form>
          ) : (
            <button
              onClick={() => setAdding(true)}
              className="guest-add-link"
            >
              + Bring a guest
            </button>
          )}
        </div>
      )}
    </div>
  )
}
