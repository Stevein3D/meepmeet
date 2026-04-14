import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import { getDatabaseUserId } from '@/lib/user-helper'
import { sendDateConfirmedEmail } from '@/lib/email'

// PATCH — { action: 'vote' } or { action: 'confirm' }
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; optionId: string }> }
) {
  const { userId: clerkUserId } = await auth()
  if (!clerkUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = await getDatabaseUserId(clerkUserId)
  if (!userId) return NextResponse.json({ error: 'Failed to resolve user' }, { status: 500 })

  const { id: eventId, optionId } = await params
  const { action } = await req.json()

  if (action === 'vote') {
    const existing = await prisma.eventDateVote.findUnique({
      where: { optionId_userId: { optionId, userId } },
    })

    if (existing) {
      await prisma.eventDateVote.delete({ where: { optionId_userId: { optionId, userId } } })
    } else {
      await prisma.eventDateVote.create({ data: { optionId, userId } })
    }

    const updated = await prisma.eventDatePoll.findUnique({
      where: { id: optionId },
      include: { votes: { select: { userId: true } } },
    })

    return NextResponse.json({ voted: !existing, option: updated })
  }

  if (action === 'confirm') {
    const caller = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } })
    if (caller?.role !== 'GAME_MASTER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const option = await prisma.eventDatePoll.findUnique({
      where: { id: optionId, eventId },
      select: { date: true },
    })
    if (!option) return NextResponse.json({ error: 'Option not found' }, { status: 404 })

    // Mark poll option confirmed + update event date + set dateConfirmed
    const [, event] = await prisma.$transaction([
      prisma.eventDatePoll.update({
        where: { id: optionId },
        data: { confirmedAt: new Date() },
      }),
      prisma.event.update({
        where: { id: eventId },
        data: { date: option.date, dateConfirmed: true },
        select: { title: true, date: true, location: true },
      }),
    ])

    // Send confirmation email to all non-visitor members
    const members = await prisma.user.findMany({
      where: { role: { not: 'VISITOR' } },
      select: { email: true, name: true },
    })
    await sendDateConfirmedEmail({
      eventTitle: event.title,
      date: event.date,
      location: event.location,
      eventId,
      recipients: members,
    })

    return NextResponse.json({ confirmed: true, date: option.date })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
