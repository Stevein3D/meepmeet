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

async function resolveAccess(clerkUserId: string, eventId: string) {
  const userId = await getDatabaseUserId(clerkUserId)
  if (!userId) return { userId: null, allowed: false }

  const [event, currentUser] = await Promise.all([
    prisma.event.findUnique({ where: { id: eventId } }),
    prisma.user.findUnique({ where: { id: userId }, select: { role: true } }),
  ])

  if (!event) return { userId, allowed: false }

  return {
    userId,
    allowed: event.hostId === userId || currentUser?.role === 'GAME_MASTER',
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; roundId: string; tableId: string }> }
) {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: eventId, roundId, tableId } = await params
    const { userId, allowed } = await resolveAccess(clerkUserId, eventId)
    if (!userId) return NextResponse.json({ error: 'Failed to resolve user' }, { status: 500 })
    if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const existing = await prisma.eventTable.findUnique({ where: { id: tableId } })
    if (!existing || existing.roundId !== roundId) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 })
    }

    const body = await request.json()
    const { label, gameId, seats, unranked } = body

    if (seats !== undefined && Number(seats) < 1) {
      return NextResponse.json({ error: 'seats must be at least 1' }, { status: 400 })
    }

    const table = await prisma.eventTable.update({
      where: { id: tableId },
      data: {
        label: label !== undefined ? label || null : undefined,
        gameId: gameId !== undefined ? gameId || null : undefined,
        seats: seats !== undefined ? Number(seats) : undefined,
        unranked: unranked !== undefined ? unranked === true : undefined,
      },
      include: tableIncludes,
    })

    return NextResponse.json(table)
  } catch (error) {
    console.error('Failed to update table:', error)
    return NextResponse.json({ error: 'Failed to update table' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; roundId: string; tableId: string }> }
) {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: eventId, roundId, tableId } = await params
    const { userId, allowed } = await resolveAccess(clerkUserId, eventId)
    if (!userId) return NextResponse.json({ error: 'Failed to resolve user' }, { status: 500 })
    if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const existing = await prisma.eventTable.findUnique({ where: { id: tableId } })
    if (!existing || existing.roundId !== roundId) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 })
    }

    await prisma.eventTable.delete({ where: { id: tableId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete table:', error)
    return NextResponse.json({ error: 'Failed to delete table' }, { status: 500 })
  }
}
