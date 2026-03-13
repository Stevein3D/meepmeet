import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import { getDatabaseUserId } from '@/lib/user-helper'

// Return all existing BGG IDs so the search form can flag already-added games
export async function GET() {
  const rows = await prisma.game.findMany({
    where: { bggId: { not: null } },
    select: { bggId: true },
  })
  return NextResponse.json(rows.map(r => r.bggId))
}

export async function POST(request: Request) {
  try {
    const { userId: clerkUserId } = await auth()

    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = await getDatabaseUserId(clerkUserId)
    if (!userId) {
      return NextResponse.json({ error: 'Failed to create user record' }, { status: 500 })
    }

    const body = await request.json()

    const gameData = {
      name: body.name,
      image: body.image ?? null,
      description: body.description ?? null,
      mechanisms: body.mechanisms ?? [],
      categories: body.categories ?? [],
      minPlayers: body.minPlayers,
      maxPlayers: body.maxPlayers,
      playtime: body.playtime,
      complexity: body.complexity ?? null,
      yearPublished: body.yearPublished ?? null,
    }

    let game
    if (body.bggId) {
      // Upsert by BGG ID so re-adding an existing game refreshes its data
      game = await prisma.game.upsert({
        where: { bggId: body.bggId },
        create: { bggId: body.bggId, ...gameData },
        update: gameData,
      })
    } else {
      game = await prisma.game.create({ data: gameData })
    }

    // Handle ownership (upsert so re-adding doesn't fail)
    if (body.iOwn) {
      await prisma.userGame.upsert({
        where: { userId_gameId: { userId, gameId: game.id } },
        create: { userId, gameId: game.id },
        update: {},
      })
    }

    return NextResponse.json(game)
  } catch (error) {
    console.error('Failed to create/update game:', error)
    return NextResponse.json({ error: 'Failed to save game' }, { status: 500 })
  }
}
