import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import { getDatabaseUserId } from '@/lib/user-helper'

async function resolveAccess(clerkUserId: string, eventId: string) {
  const userId = await getDatabaseUserId(clerkUserId)
  if (!userId) return { userId: null, allowed: false }

  const [event, currentUser] = await Promise.all([
    prisma.event.findUnique({ where: { id: eventId } }),
    prisma.user.findUnique({ where: { id: userId }, select: { role: true } }),
  ])

  if (!event) return { userId, allowed: false, notFound: true }

  const isHost = event.hostId === userId
  const isGameMaster = currentUser?.role === 'GAME_MASTER'
  return { userId, allowed: isHost || isGameMaster }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; roundId: string }> }
) {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: eventId, roundId } = await params
    const { userId, allowed } = await resolveAccess(clerkUserId, eventId)
    if (!userId) return NextResponse.json({ error: 'Failed to resolve user' }, { status: 500 })
    if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const existing = await prisma.eventRound.findUnique({ where: { id: roundId } })
    if (!existing || existing.eventId !== eventId) {
      return NextResponse.json({ error: 'Round not found' }, { status: 404 })
    }

    const body = await request.json()
    const round = await prisma.eventRound.update({
      where: { id: roundId },
      data: { label: body.label !== undefined ? body.label || null : undefined },
    })

    return NextResponse.json(round)
  } catch (error) {
    console.error('Failed to update round:', error)
    return NextResponse.json({ error: 'Failed to update round' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; roundId: string }> }
) {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: eventId, roundId } = await params
    const { userId, allowed } = await resolveAccess(clerkUserId, eventId)
    if (!userId) return NextResponse.json({ error: 'Failed to resolve user' }, { status: 500 })
    if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const existing = await prisma.eventRound.findUnique({ where: { id: roundId } })
    if (!existing || existing.eventId !== eventId) {
      return NextResponse.json({ error: 'Round not found' }, { status: 404 })
    }

    await prisma.eventRound.delete({ where: { id: roundId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete round:', error)
    return NextResponse.json({ error: 'Failed to delete round' }, { status: 500 })
  }
}
