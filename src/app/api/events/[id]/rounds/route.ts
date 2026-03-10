import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import { getDatabaseUserId } from '@/lib/user-helper'

const roundIncludes = {
  tables: {
    include: {
      game: { select: { id: true, name: true, image: true, minPlayers: true, maxPlayers: true } },
      players: {
        include: {
          user: { select: { id: true, name: true, alias: true, avatar: true } },
        },
      },
    },
    orderBy: { createdAt: 'asc' as const },
  },
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params

    const rounds = await prisma.eventRound.findMany({
      where: { eventId },
      include: roundIncludes,
      orderBy: { number: 'asc' },
    })

    return NextResponse.json(rounds)
  } catch (error) {
    console.error('Failed to fetch rounds:', error)
    return NextResponse.json({ error: 'Failed to fetch rounds' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = await getDatabaseUserId(clerkUserId)
    if (!userId) return NextResponse.json({ error: 'Failed to resolve user' }, { status: 500 })

    const { id: eventId } = await params

    const [event, currentUser] = await Promise.all([
      prisma.event.findUnique({ where: { id: eventId } }),
      prisma.user.findUnique({ where: { id: userId }, select: { role: true } }),
    ])

    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

    const isHost = event.hostId === userId
    const isGameMaster = currentUser?.role === 'GAME_MASTER'
    if (!isHost && !isGameMaster) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()

    // Find the next round number
    const last = await prisma.eventRound.findFirst({
      where: { eventId },
      orderBy: { number: 'desc' },
      select: { number: true },
    })
    const nextNumber = (last?.number ?? 0) + 1

    const round = await prisma.eventRound.create({
      data: {
        eventId,
        number: nextNumber,
        label: body.label || null,
      },
      include: roundIncludes,
    })

    return NextResponse.json(round, { status: 201 })
  } catch (error) {
    console.error('Failed to create round:', error)
    return NextResponse.json({ error: 'Failed to create round' }, { status: 500 })
  }
}
