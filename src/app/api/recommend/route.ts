import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const { message, conversationHistory = [] } = await req.json();

  // Optional: enrich with the logged-in user's taste profile
  const { userId: clerkUserId } = await auth();
  let tasteProfile = '';

  if (clerkUserId) {
    const ratings = await prisma.gameRating.findMany({
      where: { userId: clerkUserId },
      include: { game: { select: { name: true, mechanisms: true } } },
      orderBy: { rating: 'desc' },
    });

    const highRated = ratings.filter(r => r.rating >= 7);

    if (highRated.length > 0) {
      // Aggregate mechanics — games rated 9-10 count twice for weighting
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

      const ratedList = highRated
        .slice(0, 8)
        .map(r => `${r.game.name} (${r.rating}/10)`)
        .join(', ');

      tasteProfile = `\nThis user has rated these games highly (7+): ${ratedList}.
Their most-enjoyed mechanics: ${topMechs.join(', ') || 'varied'}.
Weight recommendations toward these mechanics unless the user asks for something different.\n`;
    }
  }

  const games = await prisma.game.findMany({
    orderBy: { name: 'asc' },
  });

  const gameList = games.map(g => {
    const mech = g.mechanisms.slice(0, 3).join('/') || '?';
    const cats = g.categories.slice(0, 2).join('/') || '?';
    return `${g.name}(${g.id}) ${g.minPlayers}-${g.maxPlayers}p ${g.playtime}min cx:${g.complexity?.toFixed(1) ?? '?'} [${mech}] [${cats}]`;
  }).join('\n');

  // Static block: instructions + full game library — this is what gets cached.
  // It never changes between users or sessions, so the cache stays warm.
  const staticBlock = `You are a friendly board game advisor for Meep Meet, a game night coordination app.
Help users discover games they'll enjoy from the group's shared library.
Be enthusiastic but concise. Recommend 2-3 games per response with a brief reason for each.
Only recommend games from the library below — never invent games.
If the user's request is vague, ask one short clarifying question before recommending.

When you make specific game recommendations, end your message with this tag on its own line:
GAMES_JSON:[{"id":"<exact_id_from_library>","name":"<game_name>"}]
Use exact ID values from the library. Max 3 games. Omit the tag entirely if you asked a clarifying question instead of recommending.

Group's game library:
${gameList}`;

  // Dynamic block: per-user taste profile. Lives after the cache marker so it
  // doesn't bust the cache for the game library above.
  const systemBlocks: object[] = [
    { type: 'text', text: staticBlock, cache_control: { type: 'ephemeral' } },
    ...(tasteProfile ? [{ type: 'text', text: tasteProfile.trim() }] : []),
  ];

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'prompt-caching-2024-07-31',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      stream: true,
      system: systemBlocks,
      messages: [
        ...conversationHistory.slice(-6),
        { role: 'user', content: message }
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Anthropic API error:', error);
    return new Response('AI service error', { status: 502 });
  }

  return new Response(response.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
