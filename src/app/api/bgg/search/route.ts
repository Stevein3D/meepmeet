import { NextResponse } from 'next/server'
import { searchBGG } from '@/lib/bgg'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('query')
  
  if (!query) {
    return NextResponse.json({ error: 'Query required' }, { status: 400 })
  }

  try {
    const results = await searchBGG(query)
    return NextResponse.json(results)
  } catch (error) {
    console.error('BGG search failed:', error)
    return NextResponse.json(
      { error: 'Failed to search BGG' },
      { status: 500 }
    )
  }
}