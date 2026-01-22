import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { owned } = body

    if (owned) {
      // Add ownership
      await prisma.userGame.upsert({
        where: {
          userId_gameId: {
            userId,
            gameId: id,
          },
        },
        create: {
          userId,
          gameId: id,
        },
        update: {}, // Already exists, do nothing
      })
    } else {
      // Remove ownership
      await prisma.userGame.deleteMany({
        where: {
          userId,
          gameId: id,
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to toggle ownership:', error)
    return NextResponse.json(
      { error: 'Failed to toggle ownership' },
      { status: 500 }
    )
  }
}