
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'Missing OpenAI API Key on server' });
    }

    const { text } = req.body;

    if (!text) {
        return res.status(400).json({ error: 'Missing text to translate' });
    }

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
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

        let translatedText = '';
        if (data.choices && data.choices.length > 0) {
            translatedText = data.choices[0].message.content.trim();
        }

        return res.status(200).json({ translation: translatedText });

    } catch (error) {
        console.error("Translation Internal Error", error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
