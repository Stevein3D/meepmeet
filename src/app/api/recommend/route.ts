import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const { message, conversationHistory = [] } = await req.json();

  const games = await prisma.game.findMany({
    orderBy: { name: 'asc' },
  });

  const gameList = games.map(g => {
    const mech = g.mechanisms.slice(0, 3).join('/') || '?';
    const cats = g.categories.slice(0, 2).join('/') || '?';
    return `${g.name}(${g.id}) ${g.minPlayers}-${g.maxPlayers}p ${g.playtime}min cx:${g.complexity?.toFixed(1) ?? '?'} [${mech}] [${cats}]`;
  }).join('\n');

  const systemPrompt = `You are a friendly board game advisor for Meep Meet, a game night coordination app.
Help users discover games they'll enjoy from the group's shared library.
Be enthusiastic but concise. Recommend 2-3 games per response with a brief reason for each.
Only recommend games from the library below — never invent games.
If the user's request is vague, ask one short clarifying question before recommending.

When you make specific game recommendations, end your message with this tag on its own line:
GAMES_JSON:[{"id":"<exact_id_from_library>","name":"<game_name>"}]
Use exact ID values from the library. Max 3 games. Omit the tag entirely if you asked a clarifying question instead of recommending.

Group's game library:
${gameList}`;

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
      system: [
        {
          type: 'text',
          text: systemPrompt,
          cache_control: { type: 'ephemeral' }
        }
      ],
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