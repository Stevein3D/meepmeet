'use client'

import { useState } from 'react'
import Link from 'next/link'
import RsvpButton from '../RsvpButton'
import DeleteEventButton from '../DeleteEventButton'
import { GameMasterOnly } from '../RoleGuard'

interface PollOption {
  id: string
  date: string
  votes: { userId: string }[]
}

interface EventCardProps {
  event: {
    id: string
    title: string
    date: Date
    location: string | null
    notes: string | null
    hostId: string
    host: {
      id: string
      name: string
      avatar: string | null
    }
    attendees: Array<{
      userId: string
      rsvpStatus: string
      user: {
        id: string
        name: string
        avatar: string | null
      }
    }>
  }
  userId: string | null
  dbUserId: string | null
  locationHidden?: boolean
  userRsvp: { rsvpStatus: string } | null
  dateConfirmed: boolean
  guestCount: number
  isPast: boolean
  datePolls?: PollOption[]
}

export default function EventCard({ event, userId, dbUserId: currentUserId, locationHidden = false, userRsvp, dateConfirmed, guestCount, isPast, datePolls = [] }: EventCardProps) {
  const [showControls, setShowControls] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [polls, setPolls] = useState<PollOption[]>(datePolls)
  const [pollVoting, setPollVoting] = useState(false)

  const handlePollVote = async (optionId: string) => {
    if (!userId || pollVoting) return
    setPollVoting(true)
    try {
      const res = await fetch(`/api/events/${event.id}/poll/${optionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'vote' }),
      })
      if (res.ok) {
        const { option } = await res.json()
        setPolls(prev => prev.map(p => p.id === optionId ? { ...p, votes: option.votes } : p))
      }
    } finally {
      setPollVoting(false)
    }
  }

  const handleToggle = () => {
    if (showControls) {
      setShowControls(false)
      setIsClosing(true)
      setTimeout(() => setIsClosing(false), 300)
    } else {
      setShowControls(true)
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  const getAttendeeCountByStatus = (attendees: any[]) => {
    const yesCount = attendees.filter(a => a.rsvpStatus === 'yes').length
    const maybeCount = attendees.filter(a => a.rsvpStatus === 'maybe').length
    const noCount = attendees.filter(a => a.rsvpStatus === 'no').length
    return { yesCount, maybeCount, noCount }
  }

  const { yesCount, maybeCount, noCount } = getAttendeeCountByStatus(event.attendees)

  return (
    <div className="relative flex flex-col overflow-hidden shadow-xl" style={{
      border: '4px solid #8B6F47',
      borderRadius: '8px',
      backgroundImage: 'url(/wood-bg.jpg)',
      backgroundSize: '100%',
      backgroundRepeat: 'repeat-y',
      backgroundPosition: 'center',
      backgroundColor: 'rgba(28, 16, 8, 0.6)',
      backgroundBlendMode: 'multiply',
      boxShadow: '0 10px 25px rgba(0,0,0,0.5), inset 0 1px 0 rgba(201,169,97,0.3)'
    }}>
      {/* Toggle button — Game Masters only */}
      <GameMasterOnly>
        <button
          onClick={handleToggle}
          className="absolute right-2 z-10 w-8 h-8 rounded-full flex items-center justify-center"
          style={{
            bottom: showControls ? 'calc(1.35rem + 64px)' : '1.35rem',
            background: 'linear-gradient(135deg, #C9A961, #8B6F47)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
            color: '#1A0F08',
            transition: 'bottom 0.3s ease-out'
          }}
          aria-label="Toggle controls"
        >
          <svg
            className={`w-4 h-4 transition-transform ${showControls ? '' : 'rotate-180'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </GameMasterOnly>

      <div className="p-4 flex flex-col h-full">
        <div className="flex justify-between mb-2">
          <h3 className="text-xl font-bold mb-3" style={{
            color: '#F5E6D3',
            textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
          }}>
            {event.title}
          </h3>
          <div className="min-w-fit">
            <Link
              href={`/events/${event.id}`}
              className="block text-center py-2 px-4 rounded text-sm font-medium transition-all"
              style={{
                border: '1px solid rgba(201,169,97,0.4)',
                color: '#C9A961',
                background: 'rgba(201,169,97,0.06)',
              }}
            >
              View Details
            </Link>
          </div>
        </div>

        <div className="text-sm space-y-1 flex-grow" style={{ color: '#E8D4B8' }}>
          {dateConfirmed || isPast
            ? <p className="font-medium" style={{ color: '#C9A961' }}>{formatDate(event.date)}</p>
            : <p className="font-medium" style={{ color: 'rgba(201,169,97,0.55)', fontStyle: 'italic' }}>TBD — Vote below!</p>
          }
          {(event.location || locationHidden) && (
            <p className="flex items-center gap-1">
              <span>📍</span>
              {locationHidden
                ? <span style={{ color: 'rgba(232,212,184,0.4)', fontStyle: 'italic' }}>Members only</span>
                : event.location}
            </p>
          )}
          <p>Host: {event.host.name}</p>
          {event.notes && (
            <p className="mt-2 italic opacity-90">{event.notes}</p>
          )}

          <div className="mt-2 pt-2" style={{ borderTop: '1px solid rgba(201,169,97,0.3)' }}>
            <p className="text-xs opacity-75">
              {yesCount} Yes{!isPast && ` • ${maybeCount} Maybe`} • {noCount} No{guestCount > 0 ? ` • ${guestCount} Guest${guestCount !== 1 ? 's' : ''}` : ''}
            </p>
          </div>
        </div>

        {/* Date poll voting — upcoming unconfirmed events with polls */}
        {!isPast && !dateConfirmed && polls.length > 0 && userId && (
          <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(201,169,97,0.2)' }}>
            <p className="text-xs mb-2" style={{ color: 'rgba(201,169,97,0.7)', fontWeight: 700 }}>Vote for a date:</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              {polls.map(opt => {
                const hasVoted = opt.votes.some(v => v.userId === currentUserId)
                return (
                  <button
                    key={opt.id}
                    onClick={() => handlePollVote(opt.id)}
                    disabled={pollVoting}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.3rem 0.6rem',
                      borderRadius: '0.25rem',
                      border: hasVoted ? '1px solid rgba(143,188,143,0.6)' : '1px solid rgba(201,169,97,0.25)',
                      background: hasVoted ? 'rgba(143,188,143,0.12)' : 'rgba(201,169,97,0.05)',
                      color: hasVoted ? '#8FBC8F' : 'rgba(232,212,184,0.75)',
                      cursor: pollVoting ? 'default' : 'pointer',
                      fontSize: '0.75rem',
                      textAlign: 'left',
                      width: '100%',
                    }}
                  >
                    <span>{new Date(opt.date).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                    <span style={{ flexShrink: 0, marginLeft: '0.5rem', color: opt.votes.length > 0 ? (hasVoted ? '#8FBC8F' : 'rgba(201,169,97,0.6)') : 'rgba(201,169,97,0.3)' }}>
                      {opt.votes.length} ✓
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* RSVP Buttons */}
        {userId && (dateConfirmed || isPast) && (
          <div className="mt-2" style={{ paddingRight: '34px' }}>
            {isPast && (
              <p className="text-xs mb-2" style={{ color: 'rgba(201,169,97,1)', fontWeight: 600 }}>Attended?</p>
            )}
            <RsvpButton
              eventId={event.id}
              initialStatus={(userRsvp?.rsvpStatus as 'yes' | 'no' | 'maybe') || null}
              hideMaybe={isPast}
            />
          </div>
        )}

        {/* Action Buttons — Game Masters only */}
        <GameMasterOnly>
          {(showControls || isClosing) && (
            <div
              className={`absolute bottom-0 left-0 right-0 flex gap-2 p-4 ${isClosing ? 'animate-slideDown' : 'animate-slideUp'}`}
              style={{
                background: 'rgba(20, 12, 6, 0.95)',
                borderTop: '2px solid #8B6F47'
              }}
            >
              <Link
                href={`/events/${event.id}/edit`}
                className="flex-1 px-3 py-2 text-center rounded font-medium transition-all"
                style={{
                  border: '2px solid #C9A961',
                  color: '#C9A961',
                  background: 'rgba(201,169,97,0.1)'
                }}
              >
                Edit
              </Link>
              <DeleteEventButton eventId={event.id} eventTitle={event.title} />
            </div>
          )}
        </GameMasterOnly>
      </div>
    </div>
  )
}
