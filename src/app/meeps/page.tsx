import { prisma } from '@/lib/prisma'
import Header from '@/components/Header'
import MeepCard from '@/components/MeepCard'
import { auth, currentUser as getClerkUser } from '@clerk/nextjs/server'
import { getOrCreateDatabaseUser } from '@/lib/user-helper'

export default async function MeepsPage() {
  const { userId } = await auth()

  // Ensure the logged-in user exists in the DB (webhook may not fire in local dev)
  if (userId) {
    const clerkUser = await getClerkUser()
    await getOrCreateDatabaseUser(userId, {
      email: clerkUser?.emailAddresses?.[0]?.emailAddress,
      name: `${clerkUser?.firstName || ''} ${clerkUser?.lastName || ''}`.trim() || clerkUser?.emailAddresses?.[0]?.emailAddress,
      avatar: clerkUser?.imageUrl,
    })
  }

  const [users, currentUser, goldRows, silverRows, bronzeRows, teachRows, playedRows, rankedPlayedRows] = await Promise.all([
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
    prisma.tablePlayer.groupBy({
      by: ['userId'],
      where: { placement: 1, userId: { not: null }, table: { unranked: false } },
      _count: { _all: true },
    }),
    prisma.tablePlayer.groupBy({
      by: ['userId'],
      where: { placement: 2, userId: { not: null }, table: { unranked: false } },
      _count: { _all: true },
    }),
    prisma.tablePlayer.groupBy({
      by: ['userId'],
      where: { placement: 3, userId: { not: null }, table: { unranked: false } },
      _count: { _all: true },
    }),
    prisma.tablePlayer.groupBy({
      by: ['userId'],
      where: { isGM: true, userId: { not: null } },
      _count: { _all: true },
    }),
    prisma.tablePlayer.groupBy({
      by: ['userId'],
      where: { userId: { not: null } },
      _count: { _all: true },
    }),
    prisma.tablePlayer.groupBy({
      by: ['userId'],
      where: { userId: { not: null }, table: { unranked: false } },
      _count: { _all: true },
    }),
  ])

  type CountRow = { userId: string | null; _count: { _all: number } }
  const toMap = (rows: CountRow[]) => new Map(rows.map((r) => [r.userId!, r._count._all]))

  const goldMap   = toMap(goldRows   as CountRow[])
  const silverMap = toMap(silverRows as CountRow[])
  const bronzeMap = toMap(bronzeRows as CountRow[])
  const teachMap        = toMap(teachRows        as CountRow[])
  const playedMap       = toMap(playedRows       as CountRow[])
  const rankedPlayedMap = toMap(rankedPlayedRows  as CountRow[])

  return (
    <>
      <Header />
      <main className="min-h-screen p-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold">Meeps</h1>
          <p className="parchment-text font-semibold mt-1">{users.length} member{users.length !== 1 ? 's' : ''}</p>
        </div>

        {users.length === 0 ? (
          <p className="text-gray-600">No members yet.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {users.map((user) => {
              const canEdit = userId === user.id || currentUser?.role === 'GAME_MASTER'
              const played  = playedMap.get(user.id) ?? 0
              const gold    = goldMap.get(user.id)   ?? 0
              const silver  = silverMap.get(user.id) ?? 0
              const bronze  = bronzeMap.get(user.id) ?? 0
              const teaches       = teachMap.get(user.id)        ?? 0
              const rankedPlayed  = rankedPlayedMap.get(user.id) ?? 0
              const mmr     = rankedPlayed > 0
                ? (gold * 5 + silver * 2.5 + bronze * 1) / rankedPlayed
                : 0
              return (
                <MeepCard
                  key={user.id}
                  user={user}
                  playerStats={{ played, gold, silver, bronze, teaches, mmr }}
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
