'use client'

interface GameRequest {
  id: string
  game: {
    id: string
    name: string
    image: string | null
    minPlayers: number
    maxPlayers: number
    playtime: number
    owners: {
      user: { name: string }
    }[]
  }
  user: {
    name: string
    avatar: string | null
  }
}

interface RequestedGamesProps {
  requests: GameRequest[]
}

export default function RequestedGames({ requests }: RequestedGamesProps) {
  if (requests.length === 0) return null

  return (
    <section className="mb-8">
      <h2
        className="text-2xl font-semibold mb-4"
        style={{ color: '#C9A961' }}
      >
        Requested Games
      </h2>
      <div
        className="rounded-lg p-5"
        style={{
          background: 'rgba(28,16,8,0.55)',
          border: '1px solid rgba(139,111,71,0.5)',
        }}
      >
        <div className="flex flex-col gap-3">
          {requests.map(req => {
            const owners = req.game.owners.map(o => o.user.name).join(', ')
            return (
              <div
                key={req.id}
                className="flex items-center justify-between gap-4 pb-3"
                style={{ borderBottom: '1px solid rgba(139,111,71,0.25)' }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {req.game.image && (
                    <img
                      src={req.game.image}
                      alt={req.game.name}
                      className="w-10 h-10 rounded object-cover flex-shrink-0"
                    />
                  )}
                  <div className="min-w-0">
                    <p
                      className="font-semibold truncate"
                      style={{ color: '#F5E6D3' }}
                    >
                      {req.game.name}
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: 'rgba(232,212,184,0.55)' }}
                    >
                      {req.game.minPlayers}–{req.game.maxPlayers} players
                      · {req.game.playtime}min
                      {owners ? ` · Owned by ${owners}` : ''}
                    </p>
                  </div>
                </div>
                <p
                  className="text-xs flex-shrink-0"
                  style={{ color: 'rgba(201,169,97,0.7)' }}
                >
                  requested by {req.user.name}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}