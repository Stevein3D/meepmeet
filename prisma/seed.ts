import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create or update test user
  const user = await prisma.user.upsert({
    where: { email: 'steve@example.com' },
    update: {},
    create: {
      name: 'Steve',
      email: 'steve@example.com',
    },
  })

  // Create some games using real BGG IDs
  const wingspan = await prisma.game.upsert({
    where: { bggId: 266192 },
    update: {},
    create: {
      bggId: 266192,
      name: 'Wingspan',
      minPlayers: 1,
      maxPlayers: 5,
      playtime: 60,
      complexity: 2.4,
      yearPublished: 2019,
      owners: {
        create: {
          userId: user.id,
        },
      },
    },
  })

  const terraformingMars = await prisma.game.upsert({
    where: { bggId: 167791 },
    update: {},
    create: {
      bggId: 167791,
      name: 'Terraforming Mars',
      minPlayers: 1,
      maxPlayers: 5,
      playtime: 120,
      complexity: 3.2,
      yearPublished: 2016,
      owners: {
        create: {
          userId: user.id,
        },
      },
    },
  })

  const spiritIsland = await prisma.game.upsert({
    where: { bggId: 162886 },
    update: {},
    create: {
      bggId: 162886,
      name: 'Spirit Island',
      minPlayers: 1,
      maxPlayers: 4,
      playtime: 120,
      complexity: 3.9,
      yearPublished: 2017,
      owners: {
        create: {
          userId: user.id,
        },
      },
    },
  })

  console.log({ user, wingspan, terraformingMars, spiritIsland })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })