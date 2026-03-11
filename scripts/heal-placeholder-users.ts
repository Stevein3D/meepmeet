/**
 * One-time script to find users with placeholder @temp.local emails
 * and fix them by fetching real data from the Clerk API.
 *
 * Run with:
 *   npx tsx scripts/heal-placeholder-users.ts
 */
import { PrismaClient } from '@prisma/client'
import { createClerkClient } from '@clerk/backend'

const prisma = new PrismaClient()

async function main() {
  const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })

  const placeholders = await prisma.user.findMany({
    where: { email: { endsWith: '@temp.local' } },
    select: { id: true, email: true, name: true },
  })

  if (placeholders.length === 0) {
    console.log('No placeholder users found.')
    return
  }

  console.log(`Found ${placeholders.length} placeholder user(s):`)
  placeholders.forEach((u) => console.log(`  ${u.id}  ${u.email}`))

  for (const user of placeholders) {
    try {
      const clerkUser = await clerk.users.getUser(user.id)
      const email = clerkUser.emailAddresses[0]?.emailAddress
      const name =
        `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || email

      if (!email) {
        console.warn(`  [SKIP] No email on Clerk user ${user.id}`)
        continue
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { email, name: name || user.name, avatar: clerkUser.imageUrl },
      })

      console.log(`  [FIXED] ${user.id} → ${email} (${name})`)
    } catch (err) {
      console.error(`  [ERROR] ${user.id}:`, err)
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
