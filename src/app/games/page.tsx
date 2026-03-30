import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import Header from '@/components/Header'
import { auth } from '@clerk/nextjs/server'
import GamesGrid from '@/components/GamesGrid'
import { MemberOnly } from '@/components/RoleGuard'
import GamesSidebar from '@/components/GamesSidebar'
import BackToTopButton from '@/components/BackToTopButton'

export default async function GamesPage() {
  const { userId } = await auth()

  const [games, ratingAggs, currentUser] = await Promise.all([
    prisma.game.findMany({
      orderBy: { name: 'asc' },
      include: {
        owners: {
          include: { user: true },
        },
        wants: { include: { user: { select: { name: true, alias: true } } } },
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

  // ── Sidebar data ────────────────────────────────────────────────────────────

  const sidebarFields = (g: (typeof games)[number]) => ({
    id: g.id,
    name: g.name,
    image: g.image,
    bggId: g.bggId,
    description: g.description,
    categories: g.categories,
    mechanisms: g.mechanisms,
    minPlayers: g.minPlayers,
    maxPlayers: g.maxPlayers,
    playtime: g.playtime,
    complexity: g.complexity,
    yearPublished: g.yearPublished,
  })

  const recentlyAdded = [...games]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3)
    .map(sidebarFields)

  const topRated = games
    .filter(g => meepScores[g.id])
    .sort((a, b) => {
      const aQ = (meepScores[a.id]?.count ?? 0) >= 2
      const bQ = (meepScores[b.id]?.count ?? 0) >= 2
      if (aQ && !bQ) return -1
      if (!aQ && bQ) return 1
      return (meepScores[b.id]?.avg ?? 0) - (meepScores[a.id]?.avg ?? 0)
    })
    .slice(0, 3)
    .map(g => ({ game: sidebarFields(g), avg: meepScores[g.id].avg }))

  const topInterest = games
    .filter(g => g.wants.length > 0)
    .sort((a, b) => b.wants.length - a.wants.length)
    .slice(0, 3)
    .map(g => ({
      game: sidebarFields(g),
      count: g.wants.length,
      users: g.wants.map(w => w.user.alias ?? w.user.name),
    }))

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
          <GamesGrid
            games={games}
            userId={userId}
            isGameMaster={isGameMaster}
            meepScores={meepScores}
            sidebar={
              <GamesSidebar
                recentlyAdded={recentlyAdded}
                topRated={topRated}
                topInterest={topInterest}
              />
            }
          />
        )}
      </main>
      <BackToTopButton />
    </>
  )
}
