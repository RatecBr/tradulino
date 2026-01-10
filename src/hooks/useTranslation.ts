import { useCallback } from 'react';

const API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

export const useTranslation = () => {
    const translateText = useCallback(async (text: string): Promise<string> => {
        if (!text) return '';

        // Mock catch
        if (!API_KEY || API_KEY === 'sua-chave-aqui') {
            console.warn("No API Key for translation, using mock.");
            return `[Tradução de: ${text.substring(0, 10)}...]`;
        }

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${API_KEY}`
                },
                body: JSON.stringify({
                    model: "gpt-3.5-turbo",
                    messages: [
                        {
                            role: "system",
                            content: "You are a fast translator. Translate the following English text to Portuguese (Brazil). Keep it concise/informal if appropriate for conversation. Return ONLY the translation."
                        },
                        {
                            role: "user",
                            content: text
                        }
                    ],
                    temperature: 0.3,
                    max_tokens: 60
                })
            });

            const data = await response.json();
            if (data.choices && data.choices.length > 0) {
                return data.choices[0].message.content.trim();
            }
            return '';
        } catch (err) {
            console.error("Translation error", err);
            return '';
        }
    }, []);

    return { translateText };
};
