import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import Header from '@/components/Header'
import { auth } from '@clerk/nextjs/server'
import GameCard from '@/components/GameCard'

export default async function GamesPage() {
  const { userId } = await auth()
  
  const games = await prisma.game.findMany({
    orderBy: { name: 'asc' },
    include: {
      owners: {
        include: {
          user: true
        }
      }
    }
  })

  return (
    <>
      <Header />
      <main className="min-h-screen p-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">Game Collection</h1>
          <Link
            href="/games/add"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Add Game
          </Link>
        </div>
        
        {games.length === 0 ? (
          <p className="text-gray-600">No games in the collection yet.</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {games.map((game) => {
              const userOwnsGame = userId ? game.owners.some(o => o.userId === userId) : false

              return (
                <GameCard
                  key={game.id}
                  game={game}
                  userId={userId}
                  userOwnsGame={userOwnsGame}
                />
              )
            })}
          </div>
        )}
      </main>
    </>
  )
}