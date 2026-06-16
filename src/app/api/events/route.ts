import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import { getDatabaseUserId } from '@/lib/user-helper'
import { hasPermission } from '@/lib/roles'

export async function GET() {
  try {
    const events = await prisma.event.findMany({
      orderBy: { date: 'asc' },
      include: {
        host: {
          select: { id: true, name: true, avatar: true }
        },
        attendees: {
          include: {
            user: {
              select: { id: true, name: true, avatar: true }
            }
          }
        },
        _count: {
          select: { attendees: true }
        }
      }
    })

    return NextResponse.json({ events })
  } catch (error) {
    console.error('Failed to fetch events:', error)
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { userId: clerkUserId } = await auth()

    if (!clerkUserId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get or create database user
    const userId = await getDatabaseUserId(clerkUserId)
    if (!userId) {
      return NextResponse.json(
        { error: 'Failed to create user record' },
        { status: 500 }
      )
    }

    // Only Sages and Game Masters may create events
    const currentUser = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } })
    if (!hasPermission(currentUser?.role, 'canCreateEvents')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()

    // Game Masters can assign a different host (Sages always host their own events)
    let hostId = userId
    if (body.hostId && body.hostId !== userId && currentUser?.role === 'GAME_MASTER') {
      hostId = body.hostId
    }

    const event = await prisma.event.create({
      data: {
        title: body.title,
        date: new Date(body.date),
        location: body.location || null,
        notes: body.notes || null,
        hostId,
        attendees: body.rsvpAsYes ? {
          create: {
            userId: userId,
            rsvpStatus: 'yes'
          }
        } : undefined
      }
    })

    return NextResponse.json(event)
  } catch (error) {
    console.error('Failed to create event:', error)
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    )
  }
}
