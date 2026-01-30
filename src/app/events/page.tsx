import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import Header from '@/components/Header'
import { auth } from '@clerk/nextjs/server'
import RsvpButton from '@/components/RsvpButton'
import DeleteEventButton from '@/components/DeleteEventButton'

export default async function EventsPage() {
  const { userId } = await auth()

  const events = await prisma.event.findMany({
    orderBy: { date: 'asc' },
    include: {
      host: {
        select: { id: true, name: true, avatar: true }
      },
      attendees: {
        include: {
          user: {
            select: { id: true, name: true, avatar: true }
          }
        }
      },
      _count: {
        select: { attendees: true }
      }
    }
  })

  const now = new Date()
  const upcoming = events.filter(e => new Date(e.date) >= now)
  const past = events.filter(e => new Date(e.date) < now)

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

  return (
    <>
      <Header />
      <main className="min-h-screen p-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">Game Nights</h1>
          <Link
            href="/events/add"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Add Event
          </Link>
        </div>

        {events.length === 0 ? (
          <p className="text-gray-600">No game nights scheduled yet. Be the first to create one!</p>
        ) : (
          <>
            {/* Upcoming Events */}
            {upcoming.length > 0 && (
              <div className="mb-12">
                <h2 className="text-2xl font-semibold mb-4">Upcoming Events</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {upcoming.map((event) => {
                    const userRsvp = userId ? event.attendees.find(a => a.userId === userId) : null
                    const isHost = userId === event.hostId
                    const { yesCount, maybeCount, noCount } = getAttendeeCountByStatus(event.attendees)

                    return (
                      <div key={event.id} className="border rounded-lg p-4 shadow flex flex-col">
                        <h3 className="text-xl font-bold mb-2">{event.title}</h3>

                        <div className="text-sm text-gray-700 space-y-1 flex-grow">
                          <p className="font-medium text-blue-600">{formatDate(event.date)}</p>
                          {event.location && (
                            <p className="flex items-center gap-1">
                              <span>📍</span> {event.location}
                            </p>
                          )}
                          <p>Host: {event.host.name}</p>
                          {event.notes && (
                            <p className="mt-2 text-gray-600 italic">{event.notes}</p>
                          )}

                          <div className="mt-2 pt-2 border-t">
                            <p className="text-xs text-gray-500">
                              {yesCount} Yes • {maybeCount} Maybe • {noCount} No
                            </p>
                          </div>
                        </div>

                        {/* RSVP Buttons */}
                        {userId && (
                          <div className="mt-3">
                            <RsvpButton
                              eventId={event.id}
                              initialStatus={(userRsvp?.rsvpStatus as 'yes' | 'no' | 'maybe') || null}
                            />
                          </div>
                        )}

                        {/* Action Buttons */}
                        {userId && isHost && (
                          <div className="flex gap-2 mt-3">
                            <Link
                              href={`/events/${event.id}/edit`}
                              className="flex-1 px-3 py-2 text-center border border-blue-600 text-blue-600 rounded hover:bg-blue-50"
                            >
                              Edit
                            </Link>
                            <DeleteEventButton eventId={event.id} eventTitle={event.title} />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Past Events */}
            {past.length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold mb-4 text-gray-600">Past Events</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {past.map((event) => {
                    const { yesCount, maybeCount, noCount } = getAttendeeCountByStatus(event.attendees)

                    return (
                      <div key={event.id} className="border rounded-lg p-4 shadow opacity-75">
                        <h3 className="text-xl font-bold mb-2">{event.title}</h3>

                        <div className="text-sm text-gray-700 space-y-1">
                          <p className="font-medium text-gray-600">{formatDate(event.date)}</p>
                          {event.location && (
                            <p className="flex items-center gap-1">
                              <span>📍</span> {event.location}
                            </p>
                          )}
                          <p>Host: {event.host.name}</p>

                          <div className="mt-2 pt-2 border-t">
                            <p className="text-xs text-gray-500">
                              {yesCount} attended • {maybeCount} maybe • {noCount} declined
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </>
  )
}
