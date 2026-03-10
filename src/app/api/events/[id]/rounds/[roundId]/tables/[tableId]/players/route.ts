import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import { getDatabaseUserId } from '@/lib/user-helper'

const playerIncludes = {
  user: { select: { id: true, name: true, alias: true, avatar: true } },
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

export async function POST(
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

    const table = await prisma.eventTable.findUnique({ where: { id: tableId } })
    if (!table || table.roundId !== roundId) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 })
    }

    const body = await request.json()
    const { userId: targetUserId, playerName } = body

    if (!targetUserId && !playerName) {
      return NextResponse.json({ error: 'Provide userId or playerName' }, { status: 400 })
    }

    if (targetUserId) {
      const existing = await prisma.tablePlayer.findFirst({
        where: { tableId, userId: targetUserId },
      })
      if (existing) {
        return NextResponse.json({ error: 'User is already at this table' }, { status: 409 })
      }
    }

    const player = await prisma.tablePlayer.create({
      data: {
        tableId,
        userId: targetUserId || null,
        playerName: playerName || null,
        isGM: false,
      },
      include: playerIncludes,
    })

    return NextResponse.json(player, { status: 201 })
  } catch (error) {
    console.error('Failed to add player:', error)
    return NextResponse.json({ error: 'Failed to add player' }, { status: 500 })
  }
}

export async function DELETE(
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

    const body = await request.json()
    const { playerId } = body

    if (!playerId) return NextResponse.json({ error: 'playerId required' }, { status: 400 })

    const player = await prisma.tablePlayer.findUnique({ where: { id: playerId } })
    if (!player || player.tableId !== tableId) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 })
    }

    await prisma.tablePlayer.delete({ where: { id: playerId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to remove player:', error)
    return NextResponse.json({ error: 'Failed to remove player' }, { status: 500 })
  }
}

export async function PATCH(
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

    const table = await prisma.eventTable.findUnique({ where: { id: tableId } })
    if (!table || table.roundId !== roundId) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 })
    }

    const body = await request.json()
    const { playerId, isGM } = body

    if (!playerId || typeof isGM !== 'boolean') {
      return NextResponse.json({ error: 'playerId and isGM required' }, { status: 400 })
    }

    const player = await prisma.tablePlayer.findUnique({ where: { id: playerId } })
    if (!player || player.tableId !== tableId) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 })
    }

    if (isGM) {
      // Clear GM from all other players at this table first (exclusive)
      await prisma.tablePlayer.updateMany({
        where: { tableId, id: { not: playerId } },
        data: { isGM: false },
      })
    }

    const updated = await prisma.tablePlayer.update({
      where: { id: playerId },
      data: { isGM },
      include: { user: { select: { id: true, name: true, alias: true, avatar: true } } },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Failed to update GM status:', error)
    return NextResponse.json({ error: 'Failed to update GM status' }, { status: 500 })
  }
}
