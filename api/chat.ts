
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'Missing OpenAI API Key on server' });
    }

    const { messages, temperature, max_tokens } = req.body;

    if (!messages) {
        return res.status(400).json({ error: 'Missing messages' });
    }

    try {
        const safeTemperature =
            typeof temperature === 'number' && Number.isFinite(temperature)
                ? Math.min(1.2, Math.max(0, temperature))
                : 0.7;

        const safeMaxTokens =
            typeof max_tokens === 'number' && Number.isFinite(max_tokens)
                ? Math.min(250, Math.max(1, Math.floor(max_tokens)))
                : 150;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: messages,
                temperature: safeTemperature,
                max_tokens: safeMaxTokens
            })
        });

        const data = await response.json();
        return res.status(200).json(data);

    } catch (error) {
        console.error("OpenAI Proxy Error", error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
