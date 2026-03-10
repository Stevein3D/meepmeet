import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import { getDatabaseUserId } from '@/lib/user-helper'

const tableIncludes = {
  game: { select: { id: true, name: true, image: true, minPlayers: true, maxPlayers: true } },
  players: {
    include: {
      user: { select: { id: true, name: true, alias: true, avatar: true } },
    },
  },
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; roundId: string }> }
) {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = await getDatabaseUserId(clerkUserId)
    if (!userId) return NextResponse.json({ error: 'Failed to resolve user' }, { status: 500 })

    const { id: eventId, roundId } = await params

    const [event, round, currentUser] = await Promise.all([
      prisma.event.findUnique({ where: { id: eventId } }),
      prisma.eventRound.findUnique({ where: { id: roundId } }),
      prisma.user.findUnique({ where: { id: userId }, select: { role: true } }),
    ])

    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    if (!round || round.eventId !== eventId) return NextResponse.json({ error: 'Round not found' }, { status: 404 })

    const isHost = event.hostId === userId
    const isGameMaster = currentUser?.role === 'GAME_MASTER'
    if (!isHost && !isGameMaster) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const { label, gameId, seats } = body

    if (!seats || Number(seats) < 1) {
      return NextResponse.json({ error: 'seats must be at least 1' }, { status: 400 })
    }

    const table = await prisma.eventTable.create({
      data: {
        roundId,
        label: label || null,
        gameId: gameId || null,
        seats: Number(seats),
      },
      include: tableIncludes,
    })

    return NextResponse.json(table, { status: 201 })
  } catch (error) {
    console.error('Failed to create table:', error)
    return NextResponse.json({ error: 'Failed to create table' }, { status: 500 })
  }
}
