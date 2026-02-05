import { prisma } from '@/lib/prisma'
import { User } from '@clerk/nextjs/server'

/**
 * Gets or creates a database user from a Clerk user ID.
 * This ensures the user exists in the database before we create foreign key relationships.
 *
 * @param clerkUserId - The Clerk user ID from auth()
 * @returns The database user, or null if user is not authenticated
 * @throws Error if database operations fail
 */
export async function getOrCreateDatabaseUser(clerkUserId: string | null) {
  if (!clerkUserId) {
    return null
  }

  try {
    // Try to find existing user
    let user = await prisma.user.findUnique({
      where: { id: clerkUserId }
    })

    // If user doesn't exist, create a placeholder
    // The webhook will update it with full details when it fires
    if (!user) {
      user = await prisma.user.create({
        data: {
          id: clerkUserId,
          name: 'User', // Temporary name, will be updated by webhook
          email: `clerk-${clerkUserId}@temp.local` // Temporary email
        }
      })
    }

    return user
  } catch (error) {
    console.error('Error getting or creating database user:', error)
    throw error
  }
}

/**
 * Gets the database user ID from a Clerk user ID.
 * This is useful for direct ID comparisons (e.g., hostId !== userId).
 *
 * @param clerkUserId - The Clerk user ID from auth()
 * @returns The database user ID (which is the same as clerkUserId)
 * @throws Error if user doesn't exist or database operations fail
 */
export async function getDatabaseUserId(clerkUserId: string | null): Promise<string | null> {
  if (!clerkUserId) {
    return null
  }

  try {
    const user = await getOrCreateDatabaseUser(clerkUserId)
    return user?.id || null
  } catch (error) {
    console.error('Error getting database user ID:', error)
    throw error
  }
}
