import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import { getDatabaseUserId } from '@/lib/user-helper'

// PATCH — { action: 'vote' | 'confirm' | 'unconfirm' }
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
    // The host (Sage or GM) or any Game Master may confirm the date
    const [caller, hostInfo] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { role: true } }),
      prisma.event.findUnique({ where: { id: eventId }, select: { hostId: true } }),
    ])
    if (hostInfo?.hostId !== userId && caller?.role !== 'GAME_MASTER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const option = await prisma.eventDatePoll.findUnique({
      where: { id: optionId, eventId },
      select: { date: true },
    })
    if (!option) return NextResponse.json({ error: 'Option not found' }, { status: 404 })

    // Mark poll option confirmed + update event date + set dateConfirmed.
    // Member notification is handled manually via the Compose Email tool (no
    // automatic "date confirmed" email is sent here).
    await prisma.$transaction([
      prisma.eventDatePoll.update({
        where: { id: optionId },
        data: { confirmedAt: new Date() },
      }),
      prisma.event.update({
        where: { id: eventId },
        data: { date: option.date, dateConfirmed: true },
      }),
    ])

    return NextResponse.json({ confirmed: true, date: option.date })
  }

  if (action === 'unconfirm') {
    // The host (Sage or GM) or any Game Master may re-open a confirmed date
    const [caller, hostInfo] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { role: true } }),
      prisma.event.findUnique({ where: { id: eventId }, select: { hostId: true } }),
    ])
    if (hostInfo?.hostId !== userId && caller?.role !== 'GAME_MASTER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Clear the confirmation and re-open voting. Votes are left untouched; the
    // event keeps its previously-set date until a new option is confirmed.
    await prisma.$transaction([
      prisma.eventDatePoll.update({
        where: { id: optionId, eventId },
        data: { confirmedAt: null },
      }),
      prisma.event.update({
        where: { id: eventId },
        data: { dateConfirmed: false },
      }),
    ])

    return NextResponse.json({ confirmed: false })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
