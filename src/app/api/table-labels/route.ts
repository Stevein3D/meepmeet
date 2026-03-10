import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const rows = await prisma.eventTable.findMany({
      where: { label: { not: null } },
      select: { label: true },
      distinct: ['label'],
      orderBy: { label: 'asc' },
    })

    const labels = rows.map((r) => r.label as string)
    return NextResponse.json(labels)
  } catch (error) {
    console.error('Failed to fetch table labels:', error)
    return NextResponse.json([], { status: 500 })
  }
}
