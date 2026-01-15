
import { useState, useCallback } from 'react';

export interface Suggestion {
    en: string;
    pt: string;
}

export const useAIResponse = () => {
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const generateSuggestions = useCallback(async (currentText: string, history: any[]) => {
        if (!currentText || currentText.length < 5) return;

        setIsLoading(true);
        setError(null);

        // Build conversation context (Last 6 messages)
        const recentHistory = history.slice(-6).map(h =>
            `${h.sender === 'user' ? 'Me' : 'Partner'}: ${h.text}`
        ).join('\n');

        const fullContext = `Conversation History:\n${recentHistory}\n Partner just said: "${currentText}"`;

        try {
            // Calculate context
            const now = new Date();
            const dateContext = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            const timeContext = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

            const messages = [
                {
                    role: "system",
                    content: `You are a highly intelligent conversation coach.
                    Current Real-time Context: Today is ${dateContext}, ${timeContext}.
                    
                    TASK:
                    1. Analyze the Conversation History below.
                    2. Suggest 2 distinct, VERY SHORT, natural responses for the User to say NEXT.
                    3. Ensure suggestions follow the established context.
                    
                    FORMAT:
                    You must return a raw JSON array. No markdown formatting.
                    Example:
                    [
                        {"en": "Where to?", "pt": "Para onde?"},
                        {"en": "I agree.", "pt": "Eu concordo."}
                    ]
                    
                    Strictly valid JSON only.`
                },
                {
                    role: "user",
                    content: fullContext
                }
            ];

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ messages })
            });

            if (!response.ok) throw new Error('API Request Failed');

            const data = await response.json();

            if (data.choices && data.choices.length > 0) {
                let content = data.choices[0].message.content;
                // Clean up markdown code blocks if present
                content = content.replace(/```json/g, '').replace(/```/g, '').trim();

                try {
                    const parsed = JSON.parse(content);
                    if (Array.isArray(parsed)) {
                        const newSuggestions = parsed.slice(0, 2).map((item: any) => ({
                            en: item.en || "Error",
                            pt: item.pt || "..."
                        }));
                        setSuggestions(newSuggestions);
                    }
                } catch (e) {
                    console.error("Failed to parse AI suggestions JSON", e);
                    // Fallback
                    setSuggestions([
                        { en: "I see.", pt: "Entendo." },
                        { en: "Go on.", pt: "Continue." }
                    ]);
                }
            }

        } catch (err) {
            console.error(err);
            setError('Failed to fetch suggestions');
            setSuggestions([
                { en: "I didn't catch that.", pt: "Não entendi." },
                { en: "Can you repeat?", pt: "Pode repetir?" }
            ]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { suggestions, isLoading, error, generateSuggestions };
};
