import { useCallback, useState } from 'react';

export const useAIAutoReply = () => {
  const [isReplying, setIsReplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateReply = useCallback(async (userText: string, history: any[]) => {
    const cleaned = (userText ?? '').trim();
    if (!cleaned) return null;

    setIsReplying(true);
    setError(null);

    try {
      const recentHistory = history
        .slice(-10)
        .map((h: any) => `${h.sender === 'user' ? 'User' : 'Partner'}: ${h.text}`)
        .join('\n');

      const messages = [
        {
          role: 'system',
          content:
            'You are a helpful, natural conversation partner.\n' +
            'Reply to the User in English only.\n' +
            'Keep it very short: 1 sentence, max 14 words.\n' +
            'Optional: add 1 very short follow-up question (max 7 words).\n' +
            'Do not mention being an AI and do not write lists.'
        },
        {
          role: 'user',
          content: `Conversation so far:\n${recentHistory}\n\nUser just said: "${cleaned}"`
        }
      ];

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, temperature: 0.7, max_tokens: 70 })
      });

      if (!response.ok) throw new Error('API Request Failed');

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;
      if (!content) return null;

      return String(content).replace(/```/g, '').trim();
    } catch (e) {
      setError('Failed to generate reply');
      return null;
    } finally {
      setIsReplying(false);
    }
  }, []);

  return { generateReply, isReplying, error };
};
