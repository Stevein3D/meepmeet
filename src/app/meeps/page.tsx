import { prisma } from '@/lib/prisma'
import Header from '@/components/Header'
import MeepCard from '@/components/MeepCard'
import { auth, currentUser as getClerkUser } from '@clerk/nextjs/server'
import { getOrCreateDatabaseUser } from '@/lib/user-helper'

// ── MMR helpers ────────────────────────────────────────────────────────────────

/** Modifier by player or team count (cooperative uses its own path). */
function getModifier(count: number): number {
  if (count <= 2) return 0.70
  if (count === 3) return 0.85
  if (count === 4) return 1.00
  return Math.min(1.00 + (count - 4) * 0.15, 1.90)
}

/** How many placement slots earn points at this player/team count. */
function getValidPlacements(count: number): number {
  if (count <= 2) return 1 // 1st only
  if (count === 3) return 2 // 1st & 2nd
  return 3                  // 1st, 2nd & 3rd
}

const BASE_POINTS: Record<number, number> = { 1: 100, 2: 50, 3: 25 }

// ── Page ───────────────────────────────────────────────────────────────────────

export default async function MeepsPage() {
  const { userId } = await auth()

  if (userId) {
    const clerkUser = await getClerkUser()
    await getOrCreateDatabaseUser(userId, {
      email: clerkUser?.emailAddresses?.[0]?.emailAddress,
      name: `${clerkUser?.firstName || ''} ${clerkUser?.lastName || ''}`.trim() || clerkUser?.emailAddresses?.[0]?.emailAddress,
      avatar: clerkUser?.imageUrl,
    })
  }

  const [users, currentUser, allRankedRecords, playedRows, teachRows] = await Promise.all([
    prisma.user.findMany({
      orderBy: { alias: 'asc' },
      select: {
        id: true,
        name: true,
        alias: true,
        avatar: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            ownedGames: true,
            hostedEvents: true,
            eventRsvps: true,
          },
        },
      },
    }),

    userId
      ? prisma.user.findUnique({ where: { id: userId }, select: { role: true } })
      : null,

    // Full records needed for accurate MMR (non-unranked tables only)
    prisma.tablePlayer.findMany({
      where: { userId: { not: null }, table: { unranked: false } },
      select: {
        userId: true,
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

    // Total plays for display (includes unranked)
    prisma.tablePlayer.groupBy({
      by: ['userId'],
      where: { userId: { not: null } },
      _count: { _all: true },
    }),

    // Teaches (times acting as GM)
    prisma.tablePlayer.groupBy({
      by: ['userId'],
      where: { isGM: true, userId: { not: null } },
      _count: { _all: true },
    }),
  ])

  // ── Build per-user stats from raw records ──────────────────────────────────

  type StatsEntry = {
    gold: number
    silver: number
    bronze: number
    rankedPlayed: number
    mmrPoints: number
  }

  const statsMap = new Map<string, StatsEntry>()

  for (const record of allRankedRecords) {
    const uid = record.userId!
    if (!statsMap.has(uid)) {
      statsMap.set(uid, { gold: 0, silver: 0, bronze: 0, rankedPlayed: 0, mmrPoints: 0 })
    }
    const s = statsMap.get(uid)!
    s.rankedPlayed++

    if (record.placement == null) continue

    // Medal tally
    if (record.placement === 1)      s.gold++
    else if (record.placement === 2) s.silver++
    else if (record.placement === 3) s.bronze++

    // MMR points — cooperative uses flat 0.55 modifier, 1st place only
    const { cooperative, teams } = record.table
    if (cooperative) {
      if (record.placement === 1) s.mmrPoints += BASE_POINTS[1] * 0.55
    } else {
      const count = teams ?? record.table._count.players
      const modifier        = getModifier(count)
      const validPlacements = getValidPlacements(count)
      if (record.placement <= validPlacements) {
        s.mmrPoints += (BASE_POINTS[record.placement] ?? 0) * modifier
      }
    }
  }

  type CountRow = { userId: string | null; _count: { _all: number } }
  const toMap = (rows: CountRow[]) => new Map(rows.map((r) => [r.userId!, r._count._all]))

  const playedMap = toMap(playedRows as CountRow[])
  const teachMap  = toMap(teachRows  as CountRow[])

  return (
    <>
      <Header />
      <main className="p-8 flex-1">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold">Meeps</h1>
          <p className="parchment-text font-semibold mt-1">{users.length} member{users.length !== 1 ? 's' : ''}</p>
          <p className="mt-4 text-white-600">Meet the Meeps for some tailored fun at our next Board Game Meepup!</p>
        </div>

        {users.length === 0 ? (
          <p className="text-gray-600">No members yet.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {users.map((user) => {
              const canEdit = userId === user.id || currentUser?.role === 'GAME_MASTER'
              const s       = statsMap.get(user.id) ?? { gold: 0, silver: 0, bronze: 0, rankedPlayed: 0, mmrPoints: 0 }
              const played  = playedMap.get(user.id) ?? 0
              const teaches = teachMap.get(user.id)  ?? 0
              const mmr     = s.rankedPlayed > 0 ? s.mmrPoints / s.rankedPlayed : 0
              return (
                <MeepCard
                  key={user.id}
                  user={user}
                  playerStats={{
                    played,
                    gold: s.gold,
                    silver: s.silver,
                    bronze: s.bronze,
                    teaches,
                    mmr,
                    rankedPlayed: s.rankedPlayed,
                  }}
                  canEdit={canEdit}
                />
              )
            })}
          </div>
        )}
      </main>
    </>
  )
}
