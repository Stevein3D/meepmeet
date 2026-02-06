/**
 * Migration script to consolidate duplicate user records
 *
 * Problem: Some users were created with actual email/data while others were created
 * with placeholder Clerk emails. This script identifies and consolidates them.
 *
 * Usage: npx ts-node scripts/migrate-duplicate-users.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Finding duplicate users...\n')

  // Find users that might be duplicates
  // Duplicates are identified by having similar Clerk IDs or placeholder emails
  const allUsers = await prisma.user.findMany({
    include: {
      hostedEvents: true,
      ownedGames: true,
      eventRsvps: true,
      playSessions: true,
    },
  })

  // Group users by Clerk ID (extract from placeholder emails or actual records)
  const userMap = new Map<string, any[]>()

  for (const user of allUsers) {
    // Extract Clerk ID from either the user.id (which should be Clerk ID)
    // or from placeholder email format: clerk-{clerkId}@temp.local
    let clerkId = user.id

    if (user.email.includes('@temp.local')) {
      // This is a placeholder, extract the Clerk ID from email
      const match = user.email.match(/clerk-(.+)@temp\.local/)
      if (match) {
        clerkId = match[1]
      }
    }

    if (!userMap.has(clerkId)) {
      userMap.set(clerkId, [])
    }
    userMap.get(clerkId)!.push(user)
  }

  // Find duplicates
  const duplicates = Array.from(userMap.entries()).filter(([_, users]) => users.length > 1)

  if (duplicates.length === 0) {
    console.log('✅ No duplicate users found!\n')
    return
  }

  console.log(`Found ${duplicates.length} duplicate user groups:\n`)

  // Process each duplicate group
  for (const [clerkId, users] of duplicates) {
    console.log(`Clerk ID: ${clerkId}`)
    console.log(`  Found ${users.length} user records:`)

    users.forEach((user, idx) => {
      console.log(`    ${idx + 1}. ID: ${user.id}`)
      console.log(`       Email: ${user.email}`)
      console.log(`       Name: ${user.name}`)
      console.log(`       Events hosted: ${user.hostedEvents.length}`)
      console.log(`       Games owned: ${user.ownedGames.length}`)
      console.log(`       Event RSVPs: ${user.eventRsvps.length}`)
    })

    // Identify which is the "real" user (has actual email, not placeholder)
    const realUser = users.find((u) => !u.email.includes('@temp.local'))
    const placeholderUsers = users.filter((u) => u.email.includes('@temp.local'))

    if (!realUser) {
      console.log(`  ⚠️  No real user found (all have placeholder emails)\n`)
      continue
    }

    console.log(`  ✓ Real user: ${realUser.id} (${realUser.email})`)
    console.log(`  → Consolidating ${placeholderUsers.length} placeholder user(s) into real user...\n`)

    // Migrate all foreign key references from placeholder users to real user
    for (const placeholderUser of placeholderUsers) {
      if (placeholderUser.id === realUser.id) continue

      console.log(`    Migrating ${placeholderUser.id}...`)

      // Migrate hosted events
      if (placeholderUser.hostedEvents.length > 0) {
        await prisma.event.updateMany({
          where: { hostId: placeholderUser.id },
          data: { hostId: realUser.id },
        })
        console.log(`      - Migrated ${placeholderUser.hostedEvents.length} events`)
      }

      // Migrate game ownership
      if (placeholderUser.ownedGames.length > 0) {
        await prisma.userGame.deleteMany({
          where: {
            userId: placeholderUser.id,
            // Don't delete if the real user already owns the same game
            game: {
              owners: {
                some: { userId: realUser.id },
              },
            },
          },
        })

        await prisma.userGame.updateMany({
          where: { userId: placeholderUser.id },
          data: { userId: realUser.id },
        })
        console.log(`      - Migrated ${placeholderUser.ownedGames.length} game ownerships`)
      }

      // Migrate event RSVPs
      if (placeholderUser.eventRsvps.length > 0) {
        await prisma.eventAttendee.deleteMany({
          where: {
            userId: placeholderUser.id,
            // Don't delete if the real user already has an RSVP for this event
            event: {
              attendees: {
                some: { userId: realUser.id },
              },
            },
          },
        })

        await prisma.eventAttendee.updateMany({
          where: { userId: placeholderUser.id },
          data: { userId: realUser.id },
        })
        console.log(`      - Migrated ${placeholderUser.eventRsvps.length} event RSVPs`)
      }

      // Migrate play sessions (if winner)
      const winnerSessions = await prisma.playSession.findMany({
        where: { winnerId: placeholderUser.id },
      })
      if (winnerSessions.length > 0) {
        await prisma.playSession.updateMany({
          where: { winnerId: placeholderUser.id },
          data: { winnerId: realUser.id },
        })
        console.log(`      - Migrated ${winnerSessions.length} play session wins`)
      }

      // Finally delete the placeholder user
      await prisma.user.delete({
        where: { id: placeholderUser.id },
      })
      console.log(`      ✓ Deleted placeholder user\n`)
    }
  }

  console.log('✅ Migration complete!\n')
}

main()
  .catch((error) => {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
