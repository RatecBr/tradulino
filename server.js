
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const apiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;

if (!apiKey) {
    console.warn("⚠️  WARNING: No OPENAI_API_KEY found in .env file. API calls will fail.");
}

// Helper to call OpenAI
async function callOpenAI(messages, temperature = 0.7, max_tokens = 150) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: messages,
            temperature: temperature,
            max_tokens: max_tokens
        })
    });
    return await response.json();
}

// /api/chat endpoint
app.post('/api/chat', async (req, res) => {
    try {
        const { messages } = req.body;
        if (!apiKey) return res.status(500).json({ error: 'Missing API Key' });

        const data = await callOpenAI(messages);
        res.json(data);
    } catch (error) {
        console.error("Chat Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// /api/translate endpoint
app.post('/api/translate', async (req, res) => {
    try {
        const { text } = req.body;
        if (!apiKey) return res.status(500).json({ error: 'Missing API Key' });

        const messages = [
            {
                role: "system",
                content: "You are a fast translator. Translate the following English text to Portuguese (Brazil). Keep it concise/informal if appropriate for conversation. Return ONLY the translation."
            },
            {
                role: "user",
                content: text
            }
        ];

        const data = await callOpenAI(messages, 0.3, 60);

        let translatedText = '';
        if (data.choices && data.choices.length > 0) {
            translatedText = data.choices[0].message.content.trim();
        }

        res.json({ translation: translatedText });

    } catch (error) {
        console.error("Translate Error:", error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Backend Server running at http://localhost:${port}`);
    console.log(`- Chat endpoint: http://localhost:${port}/api/chat`);
    console.log(`- Translate endpoint: http://localhost:${port}/api/translate`);
});
