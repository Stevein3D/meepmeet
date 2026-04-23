import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

// GET — return stored recommendations for a user
export async function GET(_req: NextRequest, { params }: Params) {
  const { id: userId } = await params;

  const recs = await prisma.userRecommendation.findMany({
    where: { userId },
    include: {
      game: {
        select: { id: true, bggId: true, name: true, image: true, description: true, categories: true, mechanisms: true, minPlayers: true, maxPlayers: true, playtime: true, complexity: true, yearPublished: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json({ recommendations: recs });
}

// POST — generate and persist new recommendations (owner only)
export async function POST(req: NextRequest, { params }: Params) {
  const { id: profileUserId } = await params;
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId || clerkUserId !== profileUserId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { message } = await req.json().catch(() => ({ message: undefined }));
  const count = message ? 5 : 3;

  // Fetch user's rated games sorted by rating desc
  const ratings = await prisma.gameRating.findMany({
    where: { userId: profileUserId },
    include: { game: { select: { name: true, mechanisms: true } } },
    orderBy: { rating: 'desc' },
  });

  // Fetch full game library
  const games = await prisma.game.findMany({ orderBy: { name: 'asc' } });

  const gameList = games.map(g => {
    const mech = g.mechanisms.slice(0, 3).join('/') || '?';
    const cats = g.categories.slice(0, 2).join('/') || '?';
    return `${g.name}(${g.id}) ${g.minPlayers}-${g.maxPlayers}p ${g.playtime}min cx:${g.complexity?.toFixed(1) ?? '?'} [${mech}] [${cats}]`;
  }).join('\n');

  // Build taste context
  const highRated = ratings.filter(r => r.rating >= 7);
  const mechCounts: Record<string, number> = {};
  for (const r of highRated) {
    const weight = r.rating >= 9 ? 2 : 1;
    for (const mech of r.game.mechanisms) {
      mechCounts[mech] = (mechCounts[mech] ?? 0) + weight;
    }
  }
  const topMechs = Object.entries(mechCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([m]) => m);

  const ratedSection = ratings.length
    ? `Player's rated games (highest first):\n${ratings.slice(0, 10).map(r => `${r.game.name}: ${r.rating}/10`).join('\n')}`
    : 'Player has not rated any games yet. Recommend broadly appealing games.';

  const mechSection = topMechs.length
    ? `Top mechanics from their highly-rated games (7+): ${topMechs.join(', ')}`
    : '';

  const messageSection = message
    ? `The player is currently looking for: "${message}"`
    : '';

  const prompt = `You are a board game recommendation engine.
Recommend exactly ${count} games from the library this player would enjoy.
Reply ONLY with a valid JSON array — no prose, no markdown, no explanation:
[{"id":"<exact_id>","name":"<game_name>","reason":"<one sentence>"}]

${ratedSection}

${mechSection}

${messageSection}

Exclude any games the player has already rated highly (8+) — they know those.
Only use IDs from the game library below.

Game library:
${gameList}`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    console.error('Anthropic error:', await response.text());
    return NextResponse.json({ error: 'AI service error' }, { status: 502 });
  }

  const data = await response.json();
  const rawText: string = data.content?.[0]?.text ?? '';

  // Parse JSON — strip any accidental markdown fences
  let parsed: { id: string; name: string; reason: string }[] = [];
  try {
    const clean = rawText.replace(/```json|```/g, '').trim();
    parsed = JSON.parse(clean);
  } catch {
    console.error('Failed to parse AI response:', rawText);
    return NextResponse.json({ error: 'Failed to parse recommendations' }, { status: 500 });
  }

  // Validate IDs exist in DB
  const validIds = new Set(games.map(g => g.id));
  const valid = parsed.filter(r => r.id && validIds.has(r.id)).slice(0, count);

  if (valid.length === 0) {
    return NextResponse.json({ error: 'No valid recommendations returned' }, { status: 500 });
  }

  // Replace existing recommendations atomically
  await prisma.$transaction([
    prisma.userRecommendation.deleteMany({ where: { userId: profileUserId } }),
    prisma.userRecommendation.createMany({
      data: valid.map(r => ({
        userId: profileUserId,
        gameId: r.id,
        reason: r.reason,
      })),
    }),
  ]);

  // Return saved recs with game data
  const saved = await prisma.userRecommendation.findMany({
    where: { userId: profileUserId },
    include: {
      game: {
        select: { id: true, bggId: true, name: true, image: true, description: true, categories: true, mechanisms: true, minPlayers: true, maxPlayers: true, playtime: true, complexity: true, yearPublished: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json({ recommendations: saved });
}
