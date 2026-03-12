import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import { getDatabaseUserId } from '@/lib/user-helper'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = await getDatabaseUserId(clerkUserId)
    if (!userId) return NextResponse.json({ error: 'Failed to resolve user' }, { status: 500 })

    const { id: gameId } = await params
    const body = await request.json()
    const rating = parseFloat(body.rating)

    if (isNaN(rating) || rating < 1 || rating > 10) {
      return NextResponse.json({ error: 'Rating must be between 1 and 10' }, { status: 400 })
    }

    // Round to one decimal place
    const rounded = Math.round(rating * 10) / 10

    const result = await prisma.gameRating.upsert({
      where: { userId_gameId: { userId, gameId } },
      create: { userId, gameId, rating: rounded },
      update: { rating: rounded },
    })

    return NextResponse.json({ rating: result.rating })
  } catch (error) {
    console.error('Failed to save rating:', error)
    return NextResponse.json({ error: 'Failed to save rating' }, { status: 500 })
  }
}
