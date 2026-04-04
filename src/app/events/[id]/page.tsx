import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import TablePlanner from '@/components/TablePlanner/TablePlannerClient'
import EventDatePoll from '@/components/EventDatePoll'
import EventGuestSection from '@/components/EventGuestSection'
import RsvpButton from '@/components/RsvpButton'
import { getDatabaseUserId } from '@/lib/user-helper'

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { userId: clerkUserId } = await auth()
  if (!clerkUserId) redirect('/sign-in')

  const userId = await getDatabaseUserId(clerkUserId)
  if (!userId) redirect('/sign-in')

  const { id } = await params

  const [event, currentUser, allGames, labelRows, memberRows] = await Promise.all([
    prisma.event.findUnique({
      where: { id },
      include: {
        host: { select: { id: true, name: true, avatar: true } },
        attendees: {
          include: {
            user: { select: { id: true, name: true, alias: true, avatar: true } },
          },
        },
        rounds: {
          include: {
            tables: {
              include: {
                game: {
                  select: { id: true, name: true, image: true, minPlayers: true, maxPlayers: true, bggId: true, description: true, categories: true, mechanisms: true, playtime: true, complexity: true, yearPublished: true },
                },
                players: {
                  include: {
                    user: { select: { id: true, name: true, alias: true, avatar: true } },
                  },
                  orderBy: { order: 'asc' },
                },
              },
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
        datePolls: {
          include: { votes: { select: { userId: true } } },
          orderBy: { date: 'asc' },
        },
        guests: {
          include: { bringer: { select: { id: true, name: true, alias: true } } },
          orderBy: { id: 'asc' },
        },
      },
    }),
    prisma.user.findUnique({ where: { id: userId }, select: { role: true } }),
    prisma.game.findMany({
      select: { id: true, name: true, image: true, minPlayers: true, maxPlayers: true, bggId: true, description: true, categories: true, mechanisms: true, playtime: true, complexity: true, yearPublished: true },
      orderBy: { name: 'asc' },
    }),
    prisma.eventTable.findMany({
      where: { label: { not: null } },
      select: { label: true },
      distinct: ['label'],
      orderBy: { label: 'asc' },
    }),
    prisma.user.findMany({
      where: { role: { not: 'VISITOR' } },
      select: { id: true, name: true, alias: true, avatar: true },
      orderBy: { name: 'asc' },
    }),
  ])

  if (!event) notFound()

  const isHost = event.hostId === userId
  const isGameMaster = currentUser?.role === 'GAME_MASTER'
  const isVisitor = currentUser?.role === 'VISITOR'
  const canManage = isHost || isGameMaster
  const canManageTables = isGameMaster

  type AttendeeUser = { id: string; name: string; alias: string | null; avatar: string | null }
  const confirmed: AttendeeUser[] = []
  const maybes: AttendeeUser[] = []
  const declines: AttendeeUser[] = []
  for (const a of event.attendees) {
    if (a.rsvpStatus === 'yes') confirmed.push(a.user)
    else if (a.rsvpStatus === 'maybe') maybes.push(a.user)
    else if (a.rsvpStatus === 'no') declines.push(a.user)
  }
  const attendees = confirmed
  const savedLabels = labelRows.map((r) => r.label as string)

  const myRsvp = event.attendees.find(a => a.userId === userId)
  const myRsvpStatus = (myRsvp?.rsvpStatus ?? null) as 'yes' | 'maybe' | 'no' | null

  const confirmedCount = confirmed.length
  const isPast = new Date(event.date) < new Date()

  const formattedDate = new Date(event.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/New_York',
  })

  return (
    <>
      <Header />
      <main className="flex-1 p-8" style={{ color: '#F5E6D3' }}>
        {/* Event header */}
        <div className="mb-8">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-2">
            <h1 className="text-4xl font-bold" style={{ textShadow: '1px 1px 4px rgba(0,0,0,0.6)' }}>
              {event.title}
            </h1>
            <div className="flex gap-2 flex-shrink-0">
              <Link
                href="/events"
                className="px-3 py-1.5 text-sm rounded border"
                style={{ borderColor: 'rgba(201,169,97,0.4)', color: '#C9A961' }}
              >
                ← All Events
              </Link>
              {canManage && (
                <Link
                  href={`/events/${id}/edit`}
                  className="px-3 py-1.5 text-sm rounded border"
                  style={{ borderColor: 'rgba(201,169,97,0.4)', color: '#C9A961' }}
                >
                  Edit Event
                </Link>
              )}
            </div>
          </div>

          <div
            className="rounded-lg p-5 space-y-2 mb-4"
            style={{
              background: 'rgba(28,16,8,0.55)',
              border: '1px solid rgba(139,111,71,0.5)',
            }}
          >
            <p style={{ color: '#E8D4B8' }}>
              <span style={{ color: '#C9A961', fontWeight: 600 }}>When:</span>{' '}
              {event.dateConfirmed
                ? formattedDate
                : <span style={{ color: 'rgba(201,169,97,0.6)', fontStyle: 'italic' }}>TBD — Vote below!</span>
              }
            </p>
            {event.location && (
              <p style={{ color: '#E8D4B8' }}>
                <span style={{ color: '#C9A961', fontWeight: 600 }}>Where:</span>{' '}
                {isVisitor
                  ? <span style={{ color: 'rgba(232,212,184,0.4)', fontStyle: 'italic' }}>Members only</span>
                  : event.location}
              </p>
            )}
            <p style={{ color: '#E8D4B8' }}>
              <span style={{ color: '#C9A961', fontWeight: 600 }}>Host:</span> {event.host.name}
            </p>
            {event.notes && (
              <p style={{ color: '#E8D4B8', whiteSpace: 'pre-wrap' }}>
                <span style={{ color: '#C9A961', fontWeight: 600 }}>Notes:</span> {event.notes}
              </p>
            )}
          </div>

          {/* Date poll */}
          {!isVisitor && event.datePolls.length > 0 && (
            <EventDatePoll
              eventId={id}
              options={event.datePolls.map(o => ({
                ...o,
                date: o.date.toISOString(),
                confirmedAt: o.confirmedAt?.toISOString() ?? null,
              }))}
              currentUserId={userId}
              isGameMaster={!!isGameMaster}
              dateConfirmed={event.dateConfirmed}
            />
          )}

          {/* RSVP + guests */}
          {!isVisitor && !isPast && event.dateConfirmed && (
            <div
              className="rounded-lg p-5 mb-4"
              style={{
                background: 'rgba(28,16,8,0.55)',
                border: '1px solid rgba(139,111,71,0.5)',
                maxWidth: '600px',
                width: '100%',
              }}
            >
              <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.95rem', fontWeight: 700, color: '#C9A961' }}>
                Your RSVP
              </h3>
              <RsvpButton eventId={id} initialStatus={myRsvpStatus} />
              <EventGuestSection
                eventId={id}
                guests={event.guests.map(g => ({ ...g, bringer: g.bringer }))}
                currentUserId={userId}
                userRsvpStatus={myRsvpStatus}
                isGameMaster={!!isGameMaster}
              />
            </div>
          )}

          {/* Attendee lists */}
          {(() => {
            const guestsByBringer = event.guests.reduce<Record<string, string[]>>((acc, g) => {
              acc[g.bringerId] = acc[g.bringerId] ?? []
              acc[g.bringerId].push(g.name)
              return acc
            }, {})
            const allGuestNames = event.guests.map(g => g.name)
            return (
              <div style={{ fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {confirmedCount > 0 && (
                  <div style={{ color: 'rgba(232,212,184,0.7)' }}>
                    <span style={{ color: 'rgba(201,169,97,0.7)', fontWeight: 600 }}>
                      Confirmed ({confirmedCount}):
                    </span>{' '}
                    {confirmed.map((a, i) => {
                      const myGuests = guestsByBringer[a.id]
                      return (
                        <span key={a.id}>
                          {a.alias || a.name}
                          {myGuests && <span style={{ fontSize: '0.8rem' }}> +{myGuests.length}</span>}
                          {i < confirmed.length - 1 ? ', ' : ''}
                        </span>
                      )
                    })}
                  </div>
                )}
                {allGuestNames.length > 0 && (
                  <div style={{ color: 'rgba(232,212,184,0.7)' }}>
                    <span style={{ color: 'rgba(201,169,97,0.7)', fontWeight: 600 }}>Guests ({allGuestNames.length}): </span>
                    {allGuestNames.join(', ')}
                  </div>
                )}
                {maybes.length > 0 && (
                  <div style={{ color: 'rgba(232,212,184,0.55)' }}>
                    <span style={{ color: 'rgba(201,169,97,0.5)', fontWeight: 600 }}>Maybe ({maybes.length}): </span>
                    {maybes.map((a, i) => (
                      <span key={a.id}>{a.alias || a.name}{i < maybes.length - 1 ? ', ' : ''}</span>
                    ))}
                  </div>
                )}
                {declines.length > 0 && (
                  <div style={{ color: 'rgba(232,212,184,0.4)' }}>
                    <span style={{ color: 'rgba(201,169,97,0.4)', fontWeight: 600 }}>Declined ({declines.length}): </span>
                    {declines.map((a, i) => (
                      <span key={a.id}>{a.alias || a.name}{i < declines.length - 1 ? ', ' : ''}</span>
                    ))}
                  </div>
                )}
              </div>
            )
          })()}
        </div>

        {/* Table planner */}
        <section>
          <h2 className="text-2xl font-semibold mb-4" style={{ color: '#C9A961' }}>
            Rounds & Tables
          </h2>
          <TablePlanner
            eventId={id}
            initialRounds={event.rounds}
            canManage={canManageTables}
            attendees={attendees}
            allMembers={memberRows}
            guests={event.guests.map(g => ({ id: g.id, name: g.name, bringerId: g.bringerId }))}
            games={allGames}
            savedLabels={savedLabels}
          />
        </section>
      </main>
    </>
  )
}
