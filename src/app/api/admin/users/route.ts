import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { getDatabaseUserId } from '@/lib/user-helper';
import { getAllUsers, updateUserRole } from '@/lib/user-service';
import { UserRole } from '@prisma/client';

// Only Game Masters may read the full user list or change roles.
async function requireGameMaster(): Promise<NextResponse | null> {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const dbUserId = await getDatabaseUserId(clerkUserId);
  if (!dbUserId) {
    return NextResponse.json({ error: 'Failed to resolve user' }, { status: 500 });
  }
  const caller = await prisma.user.findUnique({ where: { id: dbUserId }, select: { role: true } });
  if (caller?.role !== 'GAME_MASTER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return null;
}

// GET - List all users
export async function GET() {
  try {
    const denied = await requireGameMaster();
    if (denied) return denied;

    const users = await getAllUsers();
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// PATCH - Update user role
export async function PATCH(req: NextRequest) {
  try {
    const denied = await requireGameMaster();
    if (denied) return denied;

    const { userId, role } = await req.json();

    if (!userId || !role) {
      return NextResponse.json(
        { error: 'Missing userId or role' },
        { status: 400 }
      );
    }

    if (!Object.values(UserRole).includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    const updatedUser = await updateUserRole(userId, role as UserRole);
    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user role:', error);
    return NextResponse.json(
      { error: 'Failed to update user role' },
      { status: 500 }
    );
  }
}
