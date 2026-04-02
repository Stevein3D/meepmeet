import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import { getDatabaseUserId } from '@/lib/user-helper'

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId: clerkUserId } = await auth()

  if (!clerkUserId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = await getDatabaseUserId(clerkUserId)
  if (!userId) {
    return NextResponse.json({ error: 'Failed to resolve user' }, { status: 500 })
  }

  const { id: gameId } = await params

  const existing = await prisma.userGameWant.findUnique({
    where: { userId_gameId: { userId, gameId } },
    select: { userId: true },
  })

  if (existing) {
    await prisma.userGameWant.delete({
      where: { userId_gameId: { userId, gameId } },
    })
    return NextResponse.json({ wanted: false })
  } else {
    await prisma.userGameWant.create({ data: { userId, gameId } })
    return NextResponse.json({ wanted: true })
  }
}
