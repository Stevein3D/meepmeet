import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import TablePlanner from '@/components/TablePlanner/TablePlannerClient'
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
          where: { rsvpStatus: 'yes' },
          include: {
            user: { select: { id: true, name: true, alias: true, avatar: true } },
          },
        },
        rounds: {
          include: {
            tables: {
              include: {
                game: {
                  select: { id: true, name: true, image: true, minPlayers: true, maxPlayers: true },
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
      },
    }),
    prisma.user.findUnique({ where: { id: userId }, select: { role: true } }),
    prisma.game.findMany({
      select: { id: true, name: true, image: true, minPlayers: true, maxPlayers: true },
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
  const canManage = isHost || isGameMaster

  const attendees = event.attendees.map((a) => a.user)
  const savedLabels = labelRows.map((r) => r.label as string)

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
      <main className="min-h-screen p-8" style={{ color: '#F5E6D3' }}>
        {/* Event header */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4 mb-2">
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
              <span style={{ color: '#C9A961', fontWeight: 600 }}>When:</span> {formattedDate}
            </p>
            {event.location && (
              <p style={{ color: '#E8D4B8' }}>
                <span style={{ color: '#C9A961', fontWeight: 600 }}>Where:</span> {event.location}
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

          {attendees.length > 0 && (
            <div style={{ color: 'rgba(232,212,184,0.7)', fontSize: '0.875rem' }}>
              <p>{attendees.length} confirmed attendee{attendees.length !== 1 ? 's' : ''}</p>
              <p style={{ marginTop: '0.25rem' }}>
                {attendees.map((a, i) => (
                  <span key={a.id}>
                    {a.alias || a.name}{i < attendees.length - 1 ? ', ' : ''}
                  </span>
                ))}
              </p>
            </div>
          )}
        </div>

        {/* Table planner */}
        <section>
          <h2 className="text-2xl font-semibold mb-4" style={{ color: '#C9A961' }}>
            Rounds & Tables
          </h2>
          <TablePlanner
            eventId={id}
            initialRounds={event.rounds}
            canManage={canManage}
            attendees={attendees}
            allMembers={memberRows}
            games={allGames}
            savedLabels={savedLabels}
          />
        </section>
      </main>
    </>
  )
}
