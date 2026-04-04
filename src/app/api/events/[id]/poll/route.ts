import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import { getDatabaseUserId } from '@/lib/user-helper'
import { sendPollOpenEmail } from '@/lib/email'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const options = await prisma.eventDatePoll.findMany({
    where: { eventId: id },
    include: { votes: { select: { userId: true } } },
    orderBy: { date: 'asc' },
  })
  return NextResponse.json(options)
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId: clerkUserId } = await auth()
  if (!clerkUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = await getDatabaseUserId(clerkUserId)
  if (!userId) return NextResponse.json({ error: 'Failed to resolve user' }, { status: 500 })

  const caller = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } })
  if (caller?.role !== 'GAME_MASTER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()

  // action: 'notify' — send poll-open email to all members
  if (body.action === 'notify') {
    const [event, members] = await Promise.all([
      prisma.event.findUnique({ where: { id }, select: { title: true } }),
      prisma.user.findMany({
        where: { role: { not: 'VISITOR' } },
        select: { email: true, name: true },
      }),
    ])
    if (event) {
      sendPollOpenEmail({ eventTitle: event.title, eventId: id, recipients: members }).catch(console.error)
    }
    return NextResponse.json({ ok: true })
  }

  // Default: add a date option
  const { date } = body
  if (!date) return NextResponse.json({ error: 'date required' }, { status: 400 })

  const option = await prisma.eventDatePoll.create({
    data: { eventId: id, date: new Date(date) },
    include: { votes: { select: { userId: true } } },
  })

  return NextResponse.json(option)
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId: clerkUserId } = await auth()
  if (!clerkUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = await getDatabaseUserId(clerkUserId)
  if (!userId) return NextResponse.json({ error: 'Failed to resolve user' }, { status: 500 })

  const caller = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } })
  if (caller?.role !== 'GAME_MASTER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const { optionId } = await req.json()

  await prisma.eventDatePoll.delete({ where: { id: optionId, eventId: id } })
  return NextResponse.json({ ok: true })
}
