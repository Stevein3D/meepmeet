import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import Header from '@/components/Header'
import { auth } from '@clerk/nextjs/server'
import GamesGrid from '@/components/GamesGrid'
import { MemberOnly } from '@/components/RoleGuard';

export default async function GamesPage() {
  const { userId } = await auth()

  const [games, ratingAggs, currentUser] = await Promise.all([
    prisma.game.findMany({
      orderBy: { name: 'asc' },
      include: {
        owners: {
          include: { user: true },
        },
        wants: true,
      },
    }),
    prisma.gameRating.groupBy({
      by: ['gameId'],
      _avg: { rating: true },
      _count: { rating: true },
    }),
    userId
      ? prisma.user.findUnique({ where: { id: userId }, select: { role: true } })
      : null,
  ])

  const isGameMaster = currentUser?.role === 'GAME_MASTER'

  const meepScores: Record<string, { avg: number; count: number }> = {}
  for (const r of ratingAggs) {
    if (r._avg.rating != null) {
      meepScores[r.gameId] = { avg: r._avg.rating, count: r._count.rating }
    }
  }

  return (
    <>
      <Header />
      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold">Game Collection</h1>
          <MemberOnly>
            <Link
              href="/games/add"
              className="px-4 py-2 btn btn-md btn-primary min-w-fit"
            >
              Add Game
            </Link>
          </MemberOnly>
        </div>

        {games.length === 0 ? (
          <p className="text-gray-600">No games in the collection yet.</p>
        ) : (
          <GamesGrid games={games} userId={userId} isGameMaster={isGameMaster} meepScores={meepScores} />
        )}
      </main>
    </>
  )
}
