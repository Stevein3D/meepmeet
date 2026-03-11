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

  const [users, currentUser, winRows] = await Promise.all([
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
      where: { isWinner: true, userId: { not: null } },
      _count: { _all: true },
    }),
  ])

  const winMap = new Map(winRows.map((r) => [r.userId!, r._count._all]))

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
              const canEdit =
                userId === user.id || currentUser?.role === 'GAME_MASTER'
              return <MeepCard key={user.id} user={user} wins={winMap.get(user.id) ?? 0} canEdit={canEdit} />
            })}
          </div>
        )}
      </main>
    </>
  )
}
