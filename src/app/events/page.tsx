import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import Header from '@/components/Header'
import { auth } from '@clerk/nextjs/server'
import EventCard from '@/components/EventCard/EventCard'

export default async function EventsPage() {
  const { userId } = await auth()

  const currentUser = userId
    ? await prisma.user.findUnique({ where: { id: userId }, select: { role: true } })
    : null
  const isGameMaster = currentUser?.role === 'GAME_MASTER'

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
  const past = events.filter(e => new Date(e.date) < now).reverse()

  return (
    <>
      <Header />
      <main className="min-h-screen p-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">Game Nights</h1>
          <Link
            href="/events/add"
            className="btn btn-md btn-primary"
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
                <h2 className="text-2xl font-semibold text-white-600 mb-4">Upcoming Events</h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {upcoming.map((event) => {
                    const userRsvp = userId ? event.attendees.find(a => a.userId === userId) || null : null
                    const isHost = userId === event.hostId

                    return (
                      <EventCard
                        key={event.id}
                        event={event}
                        userId={userId}
                        isHost={isHost}
                        canManage={isHost || isGameMaster}
                        userRsvp={userRsvp}
                      />
                    )
                  })}
                </div>
              </div>
            )}

            {/* Past Events */}
            {past.length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold mb-4 text-white-600">Past Events</h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 opacity-75">
                  {past.map((event) => {
                    const userRsvp = userId ? event.attendees.find(a => a.userId === userId) || null : null
                    const isHost = userId === event.hostId

                    return (
                      <EventCard
                        key={event.id}
                        event={event}
                        userId={userId}
                        isHost={isHost}
                        canManage={isHost || isGameMaster}
                        userRsvp={userRsvp}
                      />
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
