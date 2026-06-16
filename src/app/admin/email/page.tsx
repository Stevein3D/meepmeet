import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getDatabaseUserId } from '@/lib/user-helper'
import Header from '@/components/Header'
import EmailComposer from '@/components/EmailComposer'

export default async function AdminEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ eventId?: string }>
}) {
  const { userId: clerkUserId } = await auth()
  if (!clerkUserId) redirect('/sign-in?redirect_url=/admin/email')

  const userId = await getDatabaseUserId(clerkUserId)
  if (!userId) redirect('/sign-in?redirect_url=/admin/email')

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } })
  // TODO: gate on the UBER_GM role once it exists; GAME_MASTER stands in for now.
  if (user?.role !== 'GAME_MASTER') redirect('/')

  const events = await prisma.event.findMany({
    orderBy: { date: 'desc' },
    select: { id: true, title: true, date: true },
    take: 50,
  })

  const { eventId } = await searchParams
  const fromEventId = eventId && events.some((e) => e.id === eventId) ? eventId : undefined

  return (
    <>
      <Header />
      <main className="flex-1 p-4 sm:p-8" style={{ color: '#F5E6D3' }}>
        <div className="flex items-start justify-between gap-3 mb-2">
          <h1 className="text-3xl sm:text-4xl font-bold">Compose Email</h1>
          {fromEventId && (
            <Link href={`/events/${fromEventId}`} className="btn btn-sm btn-ghost flex-shrink-0">
              ← Back to event
            </Link>
          )}
        </div>
        <p className="mb-6 text-sm" style={{ color: 'rgba(232,212,184,0.8)' }}>
          Edit the body below and send a test to the Game Masters before sending to all members.
        </p>
        <EmailComposer
          events={events.map((e) => ({ id: e.id, title: e.title, date: e.date.toISOString() }))}
          initialEventId={fromEventId}
        />
      </main>
    </>
  )
}
