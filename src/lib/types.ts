// Shared game-related types used across components

export type BaseGame = {
  id: string
  bggId: number | null
  name: string
  image: string | null
  description: string | null
  categories: string[]
  mechanisms: string[]
  minPlayers: number
  maxPlayers: number
  playtime: number
  complexity: number | null
  yearPublished: number | null
}

export type GameOwner = {
  userId: string
  user: { name: string; alias: string | null }
}

export type GameWant = {
  userId: string
  user: { name: string; alias: string | null }
}

export type Game = BaseGame & {
  owners: GameOwner[]
  wants: GameWant[]
}

export type MeepScore = { avg: number; count: number }
