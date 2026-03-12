import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import Header from '@/components/Header'
import { auth } from '@clerk/nextjs/server'
import GameCard from '@/components/GameCard'
import { MemberOnly } from '@/components/RoleGuard';

export default async function GamesPage() {
  const { userId } = await auth()
  
  const games = await prisma.game.findMany({
    orderBy: { name: 'asc' },
    include: {
      owners: {
        include: { user: true },
      },
      wants: true,
    },
  })

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
          <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {games.map((game) => {
              const userOwnsGame = userId ? game.owners.some(o => o.userId === userId) : false
              const userWantsGame = userId ? game.wants.some(w => w.userId === userId) : false
              const wantCount = game.wants.length

              return (
                <GameCard
                  key={game.id}
                  game={game}
                  userId={userId}
                  userOwnsGame={userOwnsGame}
                  userWantsGame={userWantsGame}
                  wantCount={wantCount}
                />
              )
            })}
          </div>
        )}
      </main>
    </>
  )
}