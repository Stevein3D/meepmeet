import { PrismaClient, User, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

// Get all users (for admin dashboard)
export async function getAllUsers(): Promise<User[]> {
  return await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
  });
}

// Update a user's role
export async function updateUserRole(userId: string, newRole: UserRole): Promise<User> {
  return await prisma.user.update({
    where: { id: userId },
    data: { role: newRole },
  });
}

// Get user by ID
export async function getUserById(userId: string): Promise<User | null> {
  return await prisma.user.findUnique({
    where: { id: userId },
  });
}
