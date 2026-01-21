import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    await prisma.game.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete game:', error)
    return NextResponse.json(
      { error: 'Failed to delete game' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const game = await prisma.game.findUnique({
      where: { id },
    })

    if (!game) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(game)
  } catch (error) {
    console.error('Failed to fetch game:', error)
    return NextResponse.json(
      { error: 'Failed to fetch game' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const game = await prisma.game.update({
      where: { id },
      data: {
        name: body.name,
        minPlayers: body.minPlayers,
        maxPlayers: body.maxPlayers,
        playtime: body.playtime,
        complexity: body.complexity,
        yearPublished: body.yearPublished,
        image: body.image,
      },
    })

    return NextResponse.json(game)
  } catch (error) {
    console.error('Failed to update game:', error)
    return NextResponse.json(
      { error: 'Failed to update game' },
      { status: 500 }
    )
  }
}