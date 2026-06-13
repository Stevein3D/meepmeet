import { NextResponse } from 'next/server'
import { getBGGThumbnails } from '@/lib/bgg'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const idsParam = searchParams.get('ids')

  if (!idsParam) {
    return NextResponse.json({ error: 'ids required' }, { status: 400 })
  }

  const ids = idsParam
    .split(',')
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => Number.isFinite(n))

  if (ids.length === 0) {
    return NextResponse.json({})
  }

  try {
    const thumbnails = await getBGGThumbnails(ids)
    return NextResponse.json(thumbnails)
  } catch (error) {
    console.error('BGG thumbnail route failed:', error)
    return NextResponse.json({ error: 'Failed to fetch thumbnails' }, { status: 500 })
  }
}
