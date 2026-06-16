import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import Header from '@/components/Header'
import TablePlanner from '@/components/TablePlanner/TablePlannerClient'
import EventDatePoll from '@/components/EventDatePoll'
import EventGuestSection from '@/components/EventGuestSection'
import RsvpButton from '@/components/RsvpButton'
import CollapsibleSection from '@/components/CollapsibleSection'
import { getDatabaseUserId } from '@/lib/user-helper'
import GameAdvisor from '@/components/GameAdvisor'
import RequestedGames from '@/components/RequestedGames'

type AttendeeUser = { id: string; name: string; alias: string | null; avatar: string | null }

function MiniAvatar({ user, size = 28 }: { user: AttendeeUser; size?: number }) {
  const initials = (user.alias || user.name)
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
  return (
    <div
      className="relative rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center font-bold"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.4,
        border: '1px solid rgba(201,169,97,0.5)',
        background: 'linear-gradient(135deg, #3a2010, #5c3a1e)',
        color: '#F5E6D3',
      }}
    >
      {user.avatar ? (
        <Image src={user.avatar} alt="" fill className="object-cover" unoptimized />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  )
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const { userId: clerkUserId } = await auth()
  if (!clerkUserId) redirect(`/sign-in?redirect_url=/events/${id}`)

  const userId = await getDatabaseUserId(clerkUserId)
  if (!userId) redirect(`/sign-in?redirect_url=/events/${id}`)

  const [event, currentUser, allGames, labelRows, memberRows, gameRequests] = await Promise.all([
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
          include: { votes: { include: { user: { select: { alias: true, name: true } } } } },
          orderBy: { date: 'asc' },
        },
        guests: {
          include: { bringer: { select: { id: true, name: true, alias: true } } },
          orderBy: { id: 'asc' },
        },
      },
    }),
    prisma.user.findUnique({ where: { id: userId }, select: { role: true, alias: true, name: true } }),
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
    prisma.gameRequest.findMany({
      where: { eventId: id },
      include: {
        game: {
          select: {
            id: true,
            name: true,
            image: true,
            minPlayers: true,
            maxPlayers: true,
            playtime: true,
            owners: {
              include: { user: { select: { name: true } } }
            }
          }
        },
        user: { select: { name: true, avatar: true } }
      },
      orderBy: { createdAt: 'asc' }
    }),
  ])

  if (!event) notFound()

  const isHost = event.hostId === userId
  const isGameMaster = currentUser?.role === 'GAME_MASTER'
  const isVisitor = currentUser?.role === 'VISITOR'
  const canManage = isHost || isGameMaster
  const canManageTables = isGameMaster

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
  const showRsvp = !isVisitor && !isPast && event.dateConfirmed

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
              <Link href="/events" className="btn btn-sm btn-ghost">
                ← All Events
              </Link>
              {canManage && (
                <Link href={`/events/${id}/edit`} className="btn btn-sm btn-secondary">
                  Edit Event
                </Link>
              )}
            </div>
          </div>

          {/* Details + Your RSVP — side by side (≈66/33) on large screens */}
          <div className="flex flex-col lg:flex-row gap-4 mb-4 items-stretch">
            <div
              className={`rounded-lg p-5 space-y-2 ${showRsvp ? 'lg:w-2/3' : 'w-full'}`}
              style={{
                background: 'rgba(28,16,8,0.55)',
                border: '1px solid rgba(139,111,71,0.5)',
              }}
            >
              <p style={{ color: '#E8D4B8' }}>
                <span style={{ color: '#C9A961', fontWeight: 600 }}>When:</span>{' '}
                {(event.dateConfirmed || isPast)
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

            {/* Your RSVP */}
            {showRsvp && (
              <div
                className="rounded-lg p-5 lg:w-1/3"
                style={{
                  background: 'rgba(28,16,8,0.55)',
                  border: '1px solid rgba(139,111,71,0.5)',
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
          </div>

          {/* Date poll */}
          {!isVisitor && event.datePolls.length > 0 && (
            <div className="mb-4">
              <EventDatePoll
                eventId={id}
                options={event.datePolls.map(o => ({
                  id: o.id,
                  date: o.date.toISOString(),
                  confirmedAt: o.confirmedAt?.toISOString() ?? null,
                  votes: o.votes.map(v => ({
                    userId: v.userId,
                    userAlias: v.user.alias ?? v.user.name,
                  })),
                }))}
                currentUserId={userId}
                currentUserAlias={currentUser?.alias ?? currentUser?.name ?? ''}
                isGameMaster={!!isGameMaster}
                dateConfirmed={event.dateConfirmed}
              />
            </div>
          )}

          {/* Who's coming */}
          {(() => {
            const guestsByBringer = event.guests.reduce<Record<string, string[]>>((acc, g) => {
              acc[g.bringerId] = acc[g.bringerId] ?? []
              acc[g.bringerId].push(g.name)
              return acc
            }, {})
            const allGuestNames = event.guests.map(g => g.name)
            if (confirmedCount === 0 && allGuestNames.length === 0 && maybes.length === 0 && declines.length === 0) {
              return null
            }

            const confirmedIds = new Set(confirmed.map(c => c.id))
            const confirmedGuestCount = event.guests.filter(g => confirmedIds.has(g.bringerId)).length
            const comingTotal = confirmedCount + confirmedGuestCount

            const GuestChips = ({ names }: { names: string[] }) => (
              <>
                {names.map((name, i) => (
                  <span
                    key={i}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      fontSize: '0.75rem',
                      padding: '0.1rem 0.5rem',
                      borderRadius: '999px',
                      background: 'rgba(201,169,97,0.12)',
                      border: '1px solid rgba(201,169,97,0.3)',
                      color: '#E8D4B8',
                    }}
                  >
                    +1 {name}
                  </span>
                ))}
              </>
            )

            const PersonRow = ({ user, dim = false }: { user: AttendeeUser; dim?: boolean }) => (
              <div className="flex items-center gap-2 flex-wrap">
                <MiniAvatar user={user} />
                <span style={{ color: dim ? 'rgba(245,230,211,0.85)' : '#F5E6D3', fontWeight: 600, fontSize: '0.9rem' }}>
                  {user.alias || user.name}
                </span>
                <GuestChips names={guestsByBringer[user.id] ?? []} />
              </div>
            )

            return (
              <CollapsibleSection
                className="rounded-lg p-4 lg:p-5"
                style={{
                  background: 'rgba(28,16,8,0.55)',
                  border: '1px solid rgba(139,111,71,0.5)',
                  maxWidth: '600px',
                }}
                ariaLabel="attendee list"
                bodyClassName="mt-3 pt-3"
                bodyStyle={{ borderTop: '1px solid rgba(201,169,97,0.2)' }}
                header={
                  /* Prominent count — always visible */
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span style={{ fontSize: '2.25rem', fontWeight: 800, color: '#C9A961', lineHeight: 1 }}>
                      {comingTotal}
                    </span>
                    <span style={{ color: '#E8D4B8', fontWeight: 600 }}>coming</span>
                    {confirmedGuestCount > 0 && (
                      <span style={{ color: 'rgba(232,212,184,0.8)', fontSize: '0.85rem' }}>
                        · {confirmedCount} {confirmedCount === 1 ? 'meep' : 'meeps'} + {confirmedGuestCount} {confirmedGuestCount === 1 ? 'guest' : 'guests'}
                      </span>
                    )}
                  </div>
                }
              >
                {/* Confirmed */}
                {confirmedCount > 0 && (
                  <div className="flex flex-col gap-2">
                    {confirmed.map(a => <PersonRow key={a.id} user={a} />)}
                  </div>
                )}

                {/* Maybe */}
                {maybes.length > 0 && (
                  <div className="mt-4 pt-3" style={{ borderTop: '1px solid rgba(201,169,97,0.15)' }}>
                    <div style={{ color: '#DAA520', fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                      Maybe · {maybes.length}
                    </div>
                    <div className="flex flex-col gap-2">
                      {maybes.map(a => <PersonRow key={a.id} user={a} dim />)}
                    </div>
                  </div>
                )}

                {/* Declined */}
                {declines.length > 0 && (
                  <div className="mt-4 pt-3" style={{ borderTop: '1px solid rgba(201,169,97,0.15)' }}>
                    <span style={{ color: 'rgba(201,169,97,0.7)', fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      Declined · {declines.length}
                    </span>{' '}
                    <span style={{ color: 'rgba(232,212,184,0.75)', fontSize: '0.85rem' }}>
                      {declines.map(a => a.alias || a.name).join(', ')}
                    </span>
                  </div>
                )}
              </CollapsibleSection>
            )
          })()}
        </div>

        {/* Requested games */}
        <RequestedGames requests={gameRequests} />

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
        <GameAdvisor eventId={id} />
      </main>
    </>
  )
}
