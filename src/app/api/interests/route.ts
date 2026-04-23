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

export async function POST(req: NextRequest) {
  const userId = await resolveUser();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { gameId } = await req.json();
  if (!gameId) {
    return NextResponse.json({ error: 'gameId required' }, { status: 400 });
  }

  const existing = await prisma.userGameWant.findFirst({
    where: { userId, gameId }
  });

  if (existing) {
    return NextResponse.json({ success: true, alreadySaved: true });
  }

  await prisma.userGameWant.create({
    data: { userId, gameId }
  });

  return NextResponse.json({ success: true, alreadySaved: false });
}

export async function DELETE(req: NextRequest) {
  const userId = await resolveUser();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { gameId } = await req.json();
  if (!gameId) {
    return NextResponse.json({ error: 'gameId required' }, { status: 400 });
  }

  await prisma.userGameWant.deleteMany({
    where: { userId, gameId }
  });

  return NextResponse.json({ success: true });
}