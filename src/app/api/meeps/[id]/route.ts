import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      alias: true,
      email: true,
      avatar: true,
      bggId: true,
      role: true,
      createdAt: true,
    },
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  return NextResponse.json(user)
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId: clerkUserId } = await auth()

  if (!clerkUserId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  // Fetch the current user's role from the DB
  const currentUser = await prisma.user.findUnique({
    where: { id: clerkUserId },
    select: { role: true },
  })

  const isOwner = clerkUserId === id
  const isGameMaster = currentUser?.role === 'GAME_MASTER'

  if (!isOwner && !isGameMaster) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { name, alias, bggId, role } = body

  // Only GAME_MASTERs can change another user's role
  const updateData: Record<string, string | null | undefined> = {
    name,
    alias: alias || null,
    bggId: bggId || null,
  }

  if (isGameMaster && role) {
    updateData.role = role
  }

  const updated = await prisma.user.update({
    where: { id },
    data: updateData,
  })

  return NextResponse.json(updated)
}
