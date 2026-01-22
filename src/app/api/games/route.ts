import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

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
        owners: body.iOwn ? {
          create: {
            userId: userId,
          },
        } : undefined,
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