import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import { getDatabaseUserId } from '@/lib/user-helper'
import { sendCustomEmail } from '@/lib/email'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://meepmeet.club'

export async function POST(req: Request) {
  const { userId: clerkUserId } = await auth()
  if (!clerkUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = await getDatabaseUserId(clerkUserId)
  if (!userId) return NextResponse.json({ error: 'Failed to resolve user' }, { status: 500 })

  const caller = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } })
  // TODO: gate on the UBER_GM role once it exists; GAME_MASTER stands in for now.
  if (caller?.role !== 'GAME_MASTER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const {
    subject,
    heading,
    body: emailBody,
    buttonText,
    linkType,
    customUrl,
    eventId,
    scope,
  } = await req.json()

  if (!subject?.trim() || !emailBody?.trim()) {
    return NextResponse.json({ error: 'Subject and body are required' }, { status: 400 })
  }

  // Resolve the CTA button URL (only if button text is provided)
  let buttonUrl: string | undefined
  if (buttonText?.trim()) {
    if (linkType === 'custom' && customUrl?.trim()) {
      buttonUrl = customUrl.trim()
    } else if (linkType === 'event' && eventId) {
      buttonUrl = `${APP_URL}/events/${eventId}`
    }
  }
  const finalButtonText = buttonUrl ? buttonText.trim() : undefined

  // Recipients. 'members' → everyone but visitors. 'test' → Game Masters
  // (stand-in for Uber GMs until that role lands).
  const where = scope === 'members' ? { role: { not: 'VISITOR' as const } } : { role: 'GAME_MASTER' as const }
  const recipients = (
    await prisma.user.findMany({ where, select: { email: true, name: true } })
  ).filter((r) => r.email && !r.email.endsWith('@temp.local'))

  if (recipients.length === 0) {
    return NextResponse.json({ error: 'No recipients found' }, { status: 400 })
  }

  try {
    await sendCustomEmail({
      subject: subject.trim(),
      heading: heading?.trim() || undefined,
      body: emailBody,
      buttonText: finalButtonText,
      buttonUrl,
      recipients,
    })
  } catch (error) {
    console.error('Failed to send custom email:', error)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, count: recipients.length })
}
