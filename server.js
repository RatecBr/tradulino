
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import FormData from 'form-data';

dotenv.config();

const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
// Increase JSON payload limit to 50mb to handle base64 audio
app.use(express.json({ limit: '50mb' }));

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

// /api/transcribe endpoint
app.post('/api/transcribe', async (req, res) => {
    try {
        const { audio } = req.body;
        if (!apiKey) return res.status(500).json({ error: 'Missing API Key' });

        const buffer = Buffer.from(audio, 'base64');
        const formData = new FormData();
        formData.append('file', buffer, { filename: 'audio.webm', contentType: 'audio/webm' });
        formData.append('model', 'whisper-1');
        formData.append('language', 'en');
        formData.append('prompt', 'Transcribe this English conversation. If there is silence, return nothing.');

        const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                ...formData.getHeaders()
            },
            body: formData
        });

        if (!response.ok) {
            const err = await response.text();
            console.error("OpenAI Whisper Error:", err);
            return res.status(response.status).json({ error: `OpenAI Error: ${err}` });
        }

        const data = await response.json();
        res.json({ text: data.text });

    } catch (error) {
        console.error("Transcribe Error:", error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Backend Server running at http://localhost:${port}`);
    console.log(`- Chat: http://localhost:${port}/api/chat`);
    console.log(`- Translate: http://localhost:${port}/api/translate`);
    console.log(`- Transcribe: http://localhost:${port}/api/transcribe`);
});
