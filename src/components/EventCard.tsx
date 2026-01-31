'use client'

import { useState } from 'react'
import Link from 'next/link'
import RsvpButton from './RsvpButton'
import DeleteEventButton from './DeleteEventButton'

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
  isHost: boolean
  userRsvp: { rsvpStatus: string } | null
}

export default function EventCard({ event, userId, isHost, userRsvp }: EventCardProps) {
  const [showControls, setShowControls] = useState(false)
  const [isClosing, setIsClosing] = useState(false)

  const handleToggle = () => {
    if (showControls) {
      setShowControls(false)
      setIsClosing(true)
      setTimeout(() => {
        setIsClosing(false)
      }, 300) // Match animation duration
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
      {/* Toggle button aligned with RSVP buttons */}
      {userId && isHost && (
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
      )}

      <div className="p-4 flex flex-col h-full">
        <h3 className="text-xl font-bold mb-3" style={{
          color: '#F5E6D3',
          textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
        }}>
          {event.title}
        </h3>

        <div className="text-sm space-y-1 flex-grow" style={{ color: '#E8D4B8' }}>
          <p className="font-medium" style={{ color: '#C9A961' }}>{formatDate(event.date)}</p>
          {event.location && (
            <p className="flex items-center gap-1">
              <span>📍</span> {event.location}
            </p>
          )}
          <p>Host: {event.host.name}</p>
          {event.notes && (
            <p className="mt-2 italic opacity-90">{event.notes}</p>
          )}

          <div className="mt-2 pt-2" style={{ borderTop: '1px solid rgba(201,169,97,0.3)' }}>
            <p className="text-xs opacity-75">
              {yesCount} Yes • {maybeCount} Maybe • {noCount} No
            </p>
          </div>
        </div>

        {/* RSVP Buttons */}
        {userId && (
          <div className="mt-3" style={{ paddingRight: '34px' }}>
            <RsvpButton
              eventId={event.id}
              initialStatus={(userRsvp?.rsvpStatus as 'yes' | 'no' | 'maybe') || null}
            />
          </div>
        )}

        {/* Action Buttons - overlay from bottom */}
        {(showControls || isClosing) && userId && isHost && (
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
      </div>
    </div>
  )
}
