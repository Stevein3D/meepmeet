import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { rsvpStatus } = body

    if (rsvpStatus === null) {
      // Remove RSVP
      await prisma.eventAttendee.deleteMany({
        where: {
          eventId: id,
          userId: userId
        }
      })
    } else {
      // Add or update RSVP
      await prisma.eventAttendee.upsert({
        where: {
          eventId_userId: {
            eventId: id,
            userId: userId
          }
        },
        create: {
          eventId: id,
          userId: userId,
          rsvpStatus: rsvpStatus
        },
        update: {
          rsvpStatus: rsvpStatus
        }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update RSVP:', error)
    return NextResponse.json(
      { error: 'Failed to update RSVP' },
      { status: 500 }
    )
  }
}
