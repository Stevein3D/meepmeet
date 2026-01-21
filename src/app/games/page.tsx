import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import Image from 'next/image'
import DeleteGameButton from '@/components/DeleteGameButton'

export default async function GamesPage() {
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {games.map((game) => (
            <div key={game.id} className="border rounded-lg p-4 flex flex-col">
              {game.image && (
                <div className="relative w-full h-48 mb-4 bg-gray-100 rounded">
                  <Image
                    src={game.image}
                    alt={game.name}
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
              )}
              <h2 className="text-xl font-semibold">{game.name}</h2>
              <div className="mt-2 text-sm text-gray-600 space-y-1 flex-grow">
                <p>{game.minPlayers}-{game.maxPlayers} players • {game.playtime} min</p>
                {game.yearPublished && <p>Published: {game.yearPublished}</p>}
                {game.complexity && <p>Complexity: {game.complexity.toFixed(1)}/5</p>}
                {game.owners.length > 0 && (
                  <p className="mt-1">
                    Owned by: {game.owners.map(o => o.user.name).join(', ')}
                  </p>
                )}
              </div>
              <div className="flex gap-2 mt-4">
                <Link
                  href={`/games/${game.id}/edit`}
                  className="flex-1 px-3 py-2 text-center border border-blue-600 text-blue-600 rounded hover:bg-blue-50"
                >
                  Edit
                </Link>
                <DeleteGameButton gameId={game.id} gameName={game.name} />
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}