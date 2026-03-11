import { prisma } from '@/lib/prisma'
import { clerkClient } from '@clerk/nextjs/server'

interface ClerkUserData {
  email?: string
  name?: string
  avatar?: string | null
}

async function fetchFromClerk(clerkUserId: string): Promise<ClerkUserData | null> {
  try {
    const client = await clerkClient()
    const u = await client.users.getUser(clerkUserId)
    const email = u.emailAddresses[0]?.emailAddress
    const name = `${u.firstName || ''} ${u.lastName || ''}`.trim() || email
    return { email, name, avatar: u.imageUrl }
  } catch {
    return null
  }
}

/**
 * Gets or creates a database user from a Clerk user ID.
 * Falls back to the Clerk API when no local user data is provided,
 * and heals any existing placeholder records on the fly.
 */
export async function getOrCreateDatabaseUser(
  clerkUserId: string | null,
  clerkUserData?: ClerkUserData
) {
  if (!clerkUserId) {
    return null
  }

  try {
    let user = await prisma.user.findUnique({ where: { id: clerkUserId } })

    if (!user) {
      // Fetch real data from Clerk rather than storing a placeholder
      const data = (clerkUserData?.email ? clerkUserData : null)
        ?? await fetchFromClerk(clerkUserId)
      user = await prisma.user.create({
        data: {
          id: clerkUserId,
          name: data?.name || 'User',
          email: data?.email || `clerk-${clerkUserId}@temp.local`,
          avatar: data?.avatar ?? null,
        },
      })
    } else if (user.email?.endsWith('@temp.local')) {
      // Heal existing placeholder records
      const data = (clerkUserData?.email ? clerkUserData : null)
        ?? await fetchFromClerk(clerkUserId)
      if (data?.email && !data.email.endsWith('@temp.local')) {
        user = await prisma.user.update({
          where: { id: clerkUserId },
          data: {
            email: data.email,
            name: data.name || user.name,
            avatar: data.avatar ?? user.avatar,
          },
        })
      }
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
 * @param clerkUserData - Optional Clerk user data for proper initialization
 * @returns The database user ID (which is the same as clerkUserId)
 * @throws Error if user doesn't exist or database operations fail
 */
export async function getDatabaseUserId(
  clerkUserId: string | null,
  clerkUserData?: ClerkUserData
): Promise<string | null> {
  if (!clerkUserId) {
    return null
  }

  try {
    const user = await getOrCreateDatabaseUser(clerkUserId, clerkUserData)
    return user?.id || null
  } catch (error) {
    console.error('Error getting database user ID:', error)
    throw error
  }
}
