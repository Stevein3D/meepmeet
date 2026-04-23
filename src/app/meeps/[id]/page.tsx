import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import Header from '@/components/Header'
import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import { getDatabaseUserId } from '@/lib/user-helper'
import AttendedButton from '@/components/AttendedButton'
import GameRatingInput from '@/components/GameRatingInput'
import GameInfoButton from '@/components/GameInfoButton'
import RatingInfoButton from '@/components/RatingInfoButton'
import InterestedGamesSection from '@/components/InterestedGamesSection'
import ProfileRecommendations from '@/components/ProfileRecommendations'

// ── MMR helpers (same as meeps/page.tsx) ────────────────────────────────────

function getModifier(count: number): number {
  if (count <= 2) return 0.70
  if (count === 3) return 0.85
  if (count === 4) return 1.00
  return Math.min(1.00 + (count - 4) * 0.15, 1.90)
}

function getValidPlacements(count: number): number {
  if (count <= 2) return 1
  if (count === 3) return 2
  return 3
}

const BASE_POINTS: Record<number, number> = { 1: 100, 2: 50, 3: 25 }

const roleLabel: Record<string, string> = {
  VISITOR: 'Visitor',
  MEMBER: 'Member',
  GAME_MASTER: 'Game Master',
}
const roleColors: Record<string, string> = {
  VISITOR: '#8B6F47',
  MEMBER: '#4a7c59',
  GAME_MASTER: '#7a3b3b',
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  })
}

const PANEL_STYLE: React.CSSProperties = {
  border: '3px solid #8B6F47',
  borderRadius: '8px',
  backgroundImage: 'url(/wood-bg.jpg)',
  backgroundSize: '100%',
  backgroundRepeat: 'repeat-y',
  backgroundPosition: 'center',
  backgroundColor: 'rgba(28, 16, 8, 0.6)',
  backgroundBlendMode: 'multiply',
  boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function MeepProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: profileId } = await params

  const { userId: clerkId } = await auth()
  const viewerDbId = clerkId ? await getDatabaseUserId(clerkId) : null
  const isOwner = viewerDbId === profileId

  const [profileUser, viewerUser] = await Promise.all([
    prisma.user.findUnique({
      where: { id: profileId },
      include: {
        _count: { select: { ownedGames: true, hostedEvents: true, eventRsvps: true } },
      },
    }),
    viewerDbId
      ? prisma.user.findUnique({ where: { id: viewerDbId }, select: { role: true } })
      : null,
  ])

  if (!profileUser) notFound()

  const isGM = viewerUser?.role === 'GAME_MASTER'
  const canInteract = isOwner || isGM
  const canEdit = isOwner || isGM

  // ── Stats ─────────────────────────────────────────────────────────────────

  const [rankedRecords, playedCount, teachCount] = await Promise.all([
    prisma.tablePlayer.findMany({
      where: { userId: profileId, table: { unranked: false } },
      select: {
        placement: true,
        table: {
          select: {
            cooperative: true,
            teams: true,
            _count: { select: { players: true } },
          },
        },
      },
    }),
    prisma.tablePlayer.count({ where: { userId: profileId } }),
    prisma.tablePlayer.count({ where: { userId: profileId, isGM: true } }),
  ])

  let gold = 0, silver = 0, bronze = 0, rankedPlayed = 0, mmrPoints = 0
  for (const record of rankedRecords) {
    rankedPlayed++
    if (record.placement === 1) gold++
    else if (record.placement === 2) silver++
    else if (record.placement === 3) bronze++
    if (record.placement == null) continue
    const { cooperative, teams } = record.table
    if (cooperative) {
      if (record.placement === 1) mmrPoints += BASE_POINTS[1] * 0.7
    } else {
      const count = teams ?? record.table._count.players
      const modifier = getModifier(count)
      const validPlacements = getValidPlacements(count)
      if (record.placement <= validPlacements) {
        mmrPoints += (BASE_POINTS[record.placement] ?? 0) * modifier
      }
    }
  }
  const mmr = rankedPlayed > 0 ? mmrPoints / rankedPlayed : 0

  // ── Events + games played + ratings ──────────────────────────────────────

  const [allEvents, tablePlayers, ratings, wantedGames, savedRecs] = await Promise.all([
    prisma.event.findMany({
      orderBy: { date: 'desc' },
      select: {
        id: true,
        title: true,
        date: true,
        attendees: {
          where: { userId: profileId },
          select: { rsvpStatus: true },
        },
      },
    }),
    prisma.tablePlayer.findMany({
      where: { userId: profileId, table: { gameId: { not: null } } },
      select: {
        placement: true,
        table: {
          select: {
            gameId: true,
            game: {
              select: {
                id: true, name: true, image: true,
                bggId: true, description: true, categories: true, mechanisms: true,
                minPlayers: true, maxPlayers: true, playtime: true,
                complexity: true, yearPublished: true,
              },
            },
            round: { select: { eventId: true } },
          },
        },
      },
    }),
    prisma.gameRating.findMany({
      where: { userId: profileId },
      select: { gameId: true, rating: true },
    }),
    prisma.userGameWant.findMany({
      where: { userId: profileId },
      select: {
        game: {
          select: {
            id: true, name: true, image: true,
            bggId: true, description: true, categories: true, mechanisms: true,
            minPlayers: true, maxPlayers: true, playtime: true,
            complexity: true, yearPublished: true,
          },
        },
      },
    }),
    isOwner
      ? prisma.userRecommendation.findMany({
          where: { userId: profileId },
          include: {
            game: { select: { id: true, bggId: true, name: true, image: true, description: true, categories: true, mechanisms: true, minPlayers: true, maxPlayers: true, playtime: true, complexity: true, yearPublished: true } },
          },
          orderBy: { createdAt: 'asc' },
        })
      : Promise.resolve([]),
  ])

  type GameInfo = {
    id: string; name: string; image: string | null
    bggId: number | null; description: string | null; categories: string[]; mechanisms: string[]
    minPlayers: number; maxPlayers: number; playtime: number
    complexity: number | null; yearPublished: number | null
  }

  // Build eventId → unique games map (with placements collected per game)
  const gamesByEvent = new Map<string, Map<string, { game: GameInfo; placements: number[] }>>()
  for (const tp of tablePlayers) {
    const eventId = tp.table.round.eventId
    const game = tp.table.game
    if (!game) continue
    if (!gamesByEvent.has(eventId)) gamesByEvent.set(eventId, new Map())
    const gameMap = gamesByEvent.get(eventId)!
    if (!gameMap.has(game.id)) gameMap.set(game.id, { game, placements: [] })
    const p = tp.placement
    if (p != null && p >= 1 && p <= 3) gameMap.get(game.id)!.placements.push(p)
  }

  const ratingMap = new Map(ratings.map(r => [r.gameId, r.rating]))

  const attendedEvents = allEvents.filter(e => e.attendees[0]?.rsvpStatus === 'yes')
  const otherEvents = allEvents.filter(e => e.attendees[0]?.rsvpStatus !== 'yes')

  const interestedGames = wantedGames.map(w => w.game).sort((a, b) => a.name.localeCompare(b.name))

  const initials = profileUser.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <>
      <Header />
      <main className="flex-1 p-4 sm:p-8 max-w-3xl mx-auto w-full">

        {/* ── Top nav ──────────────────────────────────────────────────── */}
        <div className="flex justify-end mb-4">
          <Link
            href="/meeps"
            className="px-3 py-1.5 text-sm rounded font-medium"
            style={{
              border: '2px solid rgba(201,169,97,0.5)',
              color: 'rgba(201,169,97,0.8)',
              background: 'rgba(201,169,97,0.06)',
            }}
          >
            ← All Meeps
          </Link>
        </div>

        {/* ── Profile header ───────────────────────────────────────────── */}
        <div className="mb-8 p-6" style={PANEL_STYLE}>
          <div className="flex gap-5 items-start">
            {/* Avatar */}
            <div
              className="relative w-20 h-20 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center text-2xl font-bold"
              style={{
                border: '3px solid #C9A961',
                background: 'linear-gradient(135deg, #3a2010, #5c3a1e)',
                color: '#F5E6D3',
              }}
            >
              {profileUser.avatar ? (
                <Image src={profileUser.avatar} alt={profileUser.name} fill className="object-cover" unoptimized />
              ) : (
                <span>{initials}</span>
              )}
            </div>

            {/* Name + role */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold leading-tight" style={{ color: '#F5E6D3', textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                {profileUser.alias ?? profileUser.name}
                {profileUser.alias && (
                  <span className="block text-sm font-normal opacity-60 mt-0.5" style={{ color: '#E8D4B8' }}>
                    {profileUser.name}
                  </span>
                )}
              </h1>
              <span
                className="inline-block mt-1 text-xs font-semibold px-3 py-1 rounded-full"
                style={{
                  background: roleColors[profileUser.role] + '33',
                  border: `1px solid ${roleColors[profileUser.role]}`,
                  color: '#E8D4B8',
                }}
              >
                {roleLabel[profileUser.role]}
              </span>
              {profileUser.tagline && (
                <p className="mt-2 text-sm" style={{ color: 'rgba(232,212,184,0.65)', fontStyle: 'italic' }}>
                  {profileUser.tagline}
                </p>
              )}
            </div>

            {/* Edit link */}
            {canEdit && (
              <Link
                href={`/meeps/${profileUser.id}/edit`}
                className="flex-shrink-0 px-3 py-1.5 text-sm rounded font-medium"
                style={{
                  border: '2px solid #C9A961',
                  color: '#C9A961',
                  background: 'rgba(201,169,97,0.1)',
                }}
              >
                Edit
              </Link>
            )}
          </div>

          {/* Stats */}
          <div
            className="grid grid-cols-3 sm:grid-cols-6 gap-3 mt-5 pt-4 text-sm text-center"
            style={{ borderTop: '1px solid rgba(201,169,97,0.3)', color: '#E8D4B8' }}
          >
            {[
              { value: gold, label: '🥇 Wins' },
              { value: teachCount, label: 'Teaches' },
              { value: profileUser._count.eventRsvps, label: 'Events' },
              { value: profileUser._count.ownedGames, label: 'Games' },
              { value: playedCount, label: 'Played' },
              { value: rankedPlayed < 4 ? '...' : mmr.toFixed(1), label: 'MMR' },
            ].map(({ value, label }) => (
              <div key={label} className="flex flex-col items-center gap-0.5">
                <span className="font-bold text-lg" style={{ color: '#C9A961' }}>{value}</span>
                <span className="text-xs opacity-70">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Recommendations (owner only) ─────────────────────────── */}
        {isOwner && (
          <ProfileRecommendations
            userId={profileId}
            initialRecs={savedRecs}
          />
        )}

        {/* ── Interested Games ─────────────────────────────────────────── */}
        <section className="mb-8">
          <h2 className="text-lg font-bold mb-3" style={{ color: '#C9A961' }}>
            Interested In
            <span className="ml-2 text-sm font-normal opacity-60" style={{ color: '#E8D4B8' }}>
              ({interestedGames.length})
            </span>
          </h2>
          <InterestedGamesSection games={interestedGames} isOwner={isOwner} />
        </section>

        {/* ── Events Attended ──────────────────────────────────────────── */}
        <section className="mb-8">
          <h2 className="text-lg font-bold mb-3" style={{ color: '#C9A961' }}>
            Events Attended
            <span className="ml-2 text-sm font-normal opacity-60" style={{ color: '#E8D4B8' }}>
              ({attendedEvents.length})
            </span>
          </h2>

          {attendedEvents.length === 0 ? (
            <p className="text-sm opacity-60" style={{ color: '#E8D4B8' }}>No events attended yet.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {attendedEvents.map(event => {
                const games = gamesByEvent.get(event.id)
                return (
                  <div key={event.id} style={{ ...PANEL_STYLE, padding: '0.875rem 1rem' }}>
                    {/* Event row */}
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/events/${event.id}`}
                          className="font-semibold hover:underline"
                          style={{ color: '#F5E6D3' }}
                        >
                          {event.title}
                        </Link>
                        <div className="text-xs mt-0.5 opacity-70" style={{ color: '#E8D4B8' }}>
                          {formatDate(event.date)}
                        </div>
                      </div>
                      {canInteract && (
                        <AttendedButton
                          eventId={event.id}
                          targetUserId={profileId}
                          initialAttended={true}
                          isOwner={isOwner}
                        />
                      )}
                    </div>

                    {/* Games played at this event */}
                    {games && games.size > 0 && (
                      <div
                        className="mt-3 pt-3 flex flex-col gap-2"
                        style={{ borderTop: '1px solid rgba(201,169,97,0.15)' }}
                      >
                        {[...games.values()].map(({ game, placements }) => (
                          <div key={game.id} className="flex items-center gap-3">
                            <GameInfoButton game={game} />
                            {placements.length > 0 && (
                              <span className="flex-shrink-0 text-base leading-none" style={{ letterSpacing: '-0.05em' }}>
                                {placements.sort((a, b) => a - b).map((p, i) => (
                                  <span key={i}>{p === 1 ? '🥇' : p === 2 ? '🥈' : '🥉'}</span>
                                ))}
                              </span>
                            )}
                            <RatingInfoButton />
                            {isOwner ? (
                              <GameRatingInput
                                gameId={game.id}
                                initialRating={ratingMap.get(game.id) ?? null}
                              />
                            ) : ratingMap.has(game.id) && (
                              <div className="flex items-center gap-1 flex-shrink-0" style={{ fontSize: '0.8125rem', color: '#E8D4B8', opacity: 0.7 }}>
                                <span>Rating</span>
                                <span style={{ color: '#C9A961', fontWeight: 600 }}>{ratingMap.get(game.id)!.toFixed(1)}</span>
                                <span style={{ opacity: 0.6 }}>/10</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* ── Other Events ─────────────────────────────────────────────── */}
        {otherEvents.length > 0 && (
          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#C9A961' }}>
              Other Events
              <span className="ml-2 text-sm font-normal opacity-60" style={{ color: '#E8D4B8' }}>
                ({otherEvents.length})
              </span>
            </h2>

            <div className="flex flex-col gap-2">
              {otherEvents.map(event => (
                <div
                  key={event.id}
                  className="flex items-center justify-between gap-3 flex-wrap px-4 py-3"
                  style={PANEL_STYLE}
                >
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/events/${event.id}`}
                      className="font-medium hover:underline"
                      style={{ color: '#F5E6D3' }}
                    >
                      {event.title}
                    </Link>
                    <div className="text-xs mt-0.5 opacity-70" style={{ color: '#E8D4B8' }}>
                      {formatDate(event.date)}
                    </div>
                  </div>
                  {canInteract && (
                    <AttendedButton
                      eventId={event.id}
                      targetUserId={profileId}
                      initialAttended={false}
                      isOwner={isOwner}
                    />
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  )
}
