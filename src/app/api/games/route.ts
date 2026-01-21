import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const game = await prisma.game.create({
      data: {
        bggId: body.bggId,
        name: body.name,
        image: body.image,
        minPlayers: body.minPlayers,
        maxPlayers: body.maxPlayers,
        playtime: body.playtime,
        complexity: body.complexity,
        yearPublished: body.yearPublished,
      },
    })

    return NextResponse.json(game)
  } catch (error) {
    console.error('Failed to create game:', error)
    return NextResponse.json(
      { error: 'Failed to create game' },
      { status: 500 }
    )
  }
}