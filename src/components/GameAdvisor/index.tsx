'use client';
import { useState, useRef, useEffect } from 'react';
import SuggestedGameCard from './SuggestedGameCard';
import styles from './GameAdvisor.module.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  suggestedGames?: SuggestedGame[];
}

export interface SuggestedGame {
  id: string;
  name: string;
}

interface GameAdvisorProps {
  eventId?: string;
}

const OPENING_MESSAGE: Message = {
  role: 'assistant',
  content: "Looking for a new game you might like? Tell me player count, how long you want to play, or just a vibe.",
};

export default function GameAdvisor({ eventId }: GameAdvisorProps) {
  const [messages, setMessages] = useState<Message[]>([OPENING_MESSAGE]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Build conversation history for API — strip suggestedGames,
  // strip GAMES_JSON tag from assistant messages
  function buildHistory(): { role: string; content: string }[] {
    return messages.map(m => ({
      role: m.role,
      content: m.content.replace(/\nGAMES_JSON:\[.*?\]$/s, '').trim()
    }));
  }

  function parseGamesJson(text: string): {
    cleanText: string;
    games: SuggestedGame[];
  } {
    const match = text.match(/\nGAMES_JSON:(\[.*?\])$/s);
    if (!match) return { cleanText: text, games: [] };

    try {
      const games = JSON.parse(match[1]) as SuggestedGame[];
      const cleanText = text.slice(0, match.index).trim();
      return { cleanText, games };
    } catch {
      return { cleanText: text, games: [] };
    }
  }

  async function sendMessage() {
    if (!input.trim() || isStreaming) return;

    const userMessage = input.trim();
    setInput('');

    const history = buildHistory();

    setMessages(prev => [
      ...prev,
      { role: 'user', content: userMessage },
      { role: 'assistant', content: '' }
    ]);
    setIsStreaming(true);

    try {
      const res = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          eventId,
          conversationHistory: history,
        }),
      });

      if (!res.ok) throw new Error(`API error ${res.status}`);

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]' || data === '') continue;

          try {
            const parsed = JSON.parse(data);
            // Handle Anthropic streaming event types
            if (parsed.type === 'content_block_delta') {
              const text = parsed.delta?.text ?? '';
              if (text) {
                fullText += text;
                setMessages(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    ...updated[updated.length - 1],
                    content: fullText,
                  };
                  return updated;
                });
              }
            }
          } catch {
            // Non-JSON lines in stream, skip
          }
        }
      }

      // Stream complete — parse out GAMES_JSON
      const { cleanText, games } = parseGamesJson(fullText);
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: 'assistant',
          content: cleanText,
          suggestedGames: games.length ? games : undefined,
        };
        return updated;
      });

    } catch (err) {
      console.error('Advisor error:', err);
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: 'assistant',
          content: "Sorry, I hit a snag. Give it another try.",
        };
        return updated;
      });
    } finally {
      setIsStreaming(false);
    }
  }

  return (
    <>
      {/* Floating trigger button */}
      <div className={styles.triggerWrapper}>
        <button
          className={styles.trigger}
          onClick={() => setIsOpen(prev => !prev)}
          aria-label="Open game advisor"
        >
          <span className={styles.triggerIcon}>🎲</span>
          <span className={styles.triggerLabel}>Game Advisor</span>
        </button>
      </div>

      {/* Panel */}
      {isOpen && (
        <div className={styles.panel}>
          <div className={styles.header}>
            <span className={styles.headerTitle}>Game Advisor</span>
            <button
              className={styles.closeButton}
              onClick={() => setIsOpen(false)}
              aria-label="Close advisor"
            >
              ✕
            </button>
          </div>

          <div className={styles.messageList}>
            {messages.map((msg, i) => (
              <div key={i} className={styles.messageGroup}>
                <div className={`${styles.bubble} ${styles[msg.role]}`}>
                  {msg.content}
                  {isStreaming && i === messages.length - 1 && msg.role === 'assistant' && (
                    <span className={styles.cursor} aria-hidden="true" />
                  )}
                </div>

                {/* Suggested game cards render below the assistant bubble */}
                {msg.suggestedGames?.length && (
                  <div className={styles.suggestions}>
                    {msg.suggestedGames.map(game => (
                      <SuggestedGameCard
                        key={game.id}
                        game={game}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <div className={styles.inputRow}>
            <input
              ref={inputRef}
              className={styles.input}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="What are you in the mood for?"
              disabled={isStreaming}
              aria-label="Message input"
            />
            <button
              className={styles.sendButton}
              onClick={sendMessage}
              disabled={isStreaming || !input.trim()}
              aria-label="Send message"
            >
              {isStreaming ? '…' : '↑'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}