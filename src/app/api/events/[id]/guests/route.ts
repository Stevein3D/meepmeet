import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import { getDatabaseUserId } from '@/lib/user-helper'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const guests = await prisma.eventGuest.findMany({
    where: { eventId: id },
    include: { bringer: { select: { id: true, name: true, alias: true } } },
    orderBy: { id: 'asc' },
  })
  return NextResponse.json(guests)
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId: clerkUserId } = await auth()
  if (!clerkUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = await getDatabaseUserId(clerkUserId)
  if (!userId) return NextResponse.json({ error: 'Failed to resolve user' }, { status: 500 })

  const { id } = await params
  const { name } = await req.json()

  if (!name?.trim()) return NextResponse.json({ error: 'name required' }, { status: 400 })

  // Must be RSVPd yes or maybe to add guests
  const rsvp = await prisma.eventAttendee.findUnique({
    where: { eventId_userId: { eventId: id, userId } },
    select: { rsvpStatus: true },
  })
  if (!rsvp || rsvp.rsvpStatus === 'no') {
    return NextResponse.json({ error: 'RSVP yes or maybe to add guests' }, { status: 403 })
  }

  const guest = await prisma.eventGuest.create({
    data: { eventId: id, bringerId: userId, name: name.trim() },
    include: { bringer: { select: { id: true, name: true, alias: true } } },
  })

  return NextResponse.json(guest)
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId: clerkUserId } = await auth()
  if (!clerkUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = await getDatabaseUserId(clerkUserId)
  if (!userId) return NextResponse.json({ error: 'Failed to resolve user' }, { status: 500 })

  const { id } = await params
  const { guestId } = await req.json()

  const guest = await prisma.eventGuest.findUnique({
    where: { id: guestId },
    select: { bringerId: true },
  })

  if (!guest) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Only the bringer or a GM can remove
  const caller = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } })
  if (guest.bringerId !== userId && caller?.role !== 'GAME_MASTER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.eventGuest.delete({ where: { id: guestId, eventId: id } })
  return NextResponse.json({ ok: true })
}
