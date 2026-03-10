import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import { getDatabaseUserId } from '@/lib/user-helper'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const event = await prisma.event.findUnique({
      where: { id },
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

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(event)
  } catch (error) {
    console.error('Failed to fetch event:', error)
    return NextResponse.json(
      { error: 'Failed to fetch event' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params
    const body = await request.json()

    // Check if user is the host or a Game Master
    const [existingEvent, currentUser] = await Promise.all([
      prisma.event.findUnique({ where: { id } }),
      prisma.user.findUnique({ where: { id: userId }, select: { role: true } }),
    ])

    if (!existingEvent) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    const isHost = existingEvent.hostId === userId
    const isGameMaster = currentUser?.role === 'GAME_MASTER'

    if (!isHost && !isGameMaster) {
      return NextResponse.json(
        { error: 'Forbidden: Only the event host or a Game Master can edit this event' },
        { status: 403 }
      )
    }

    const updateData: Record<string, unknown> = {
      title: body.title,
      date: new Date(body.date),
      location: body.location || null,
      notes: body.notes || null,
    }

    // Only Game Masters can reassign the host
    if (isGameMaster && body.hostId) {
      updateData.hostId = body.hostId
    }

    // Update event details
    const event = await prisma.event.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(event)
  } catch (error) {
    console.error('Failed to update event:', error)
    return NextResponse.json(
      { error: 'Failed to update event' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params

    // Check if user is the host
    const existingEvent = await prisma.event.findUnique({
      where: { id }
    })

    if (!existingEvent) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    if (existingEvent.hostId !== userId) {
      return NextResponse.json(
        { error: 'Forbidden: Only the event host can delete this event' },
        { status: 403 }
      )
    }

    await prisma.event.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete event:', error)
    return NextResponse.json(
      { error: 'Failed to delete event' },
      { status: 500 }
    )
  }
}
