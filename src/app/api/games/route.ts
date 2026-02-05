import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import { getDatabaseUserId } from '@/lib/user-helper'

export async function POST(request: Request) {
  try {
    const { userId: clerkUserId } = await auth()

    if (!clerkUserId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get or create database user
    const userId = await getDatabaseUserId(clerkUserId)
    if (!userId) {
      return NextResponse.json(
        { error: 'Failed to create user record' },
        { status: 500 }
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