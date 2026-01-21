import { NextResponse } from 'next/server'
import { getBGGGame } from '@/lib/bgg'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  
  try {
    const game = await getBGGGame(parseInt(id))
    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }
    return NextResponse.json(game)
  } catch (error) {
    console.error('BGG fetch failed:', error)
    return NextResponse.json(
      { error: 'Failed to fetch game from BGG' },
      { status: 500 }
    )
  }
}