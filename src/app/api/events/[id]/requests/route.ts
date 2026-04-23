import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth, currentUser } from '@clerk/nextjs/server';
import { getDatabaseUserId } from '@/lib/user-helper';

async function resolveUser() {
  const { userId: clerkUserId } = await auth();
  const clerkUser = await currentUser();
  if (!clerkUserId || !clerkUser) return null;

  const clerkUserData = {
    email: clerkUser.emailAddresses?.[0]?.emailAddress,
    name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim()
      || clerkUser.emailAddresses?.[0]?.emailAddress,
    avatar: clerkUser.imageUrl
  };

  return getDatabaseUserId(clerkUserId, clerkUserData);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await resolveUser();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { gameId, note } = await req.json();
  if (!gameId) {
    return NextResponse.json({ error: 'gameId required' }, { status: 400 });
  }

  const { id: eventId } = await params;

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

  const existing = await prisma.gameRequest.findFirst({
    where: { gameId, userId, eventId }
  });

  if (existing) {
    return NextResponse.json({ success: true, alreadyRequested: true });
  }

  const request = await prisma.gameRequest.create({
    data: { gameId, userId, eventId, note: note ?? null },
    include: {
      game: { select: { name: true, image: true } },
      user: { select: { name: true } }
    }
  });

  return NextResponse.json({ success: true, request });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await resolveUser();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: eventId } = await params;

  const requests = await prisma.gameRequest.findMany({
    where: { eventId },
    include: {
      game: {
        select: {
          id: true,
          name: true,
          image: true,
          minPlayers: true,
          maxPlayers: true,
          playtime: true,
          owners: {
            include: { user: { select: { name: true } } }
          }
        }
      },
      user: { select: { name: true, avatar: true } }
    },
    orderBy: { createdAt: 'asc' }
  });

  return NextResponse.json({ requests });
}