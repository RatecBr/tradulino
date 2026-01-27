
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
        const { messages, temperature, max_tokens } = req.body;
        if (!apiKey) return res.status(500).json({ error: 'Missing API Key' });
        if (!messages) return res.status(400).json({ error: 'Missing messages' });

        const safeTemperature =
            typeof temperature === 'number' && Number.isFinite(temperature)
                ? Math.min(1.2, Math.max(0, temperature))
                : 0.7;

        const safeMaxTokens =
            typeof max_tokens === 'number' && Number.isFinite(max_tokens)
                ? Math.min(250, Math.max(1, Math.floor(max_tokens)))
                : 150;

        const data = await callOpenAI(messages, safeTemperature, safeMaxTokens);
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
        const { audio, mimeType } = req.body;
        if (!apiKey) return res.status(500).json({ error: 'Missing API Key' });

        const buffer = Buffer.from(audio, 'base64');
        const safeMimeTypeRaw = typeof mimeType === 'string' && mimeType.length > 0 ? mimeType : 'audio/webm';
        const safeMimeType = safeMimeTypeRaw.split(';')[0].trim() || 'audio/webm';
        const magicHex = buffer.subarray(0, 4).toString('hex');
        const detected =
            magicHex === '1a45dfa3' ? { filename: 'audio.webm', contentType: 'audio/webm' } :
            magicHex === '4f676753' ? { filename: 'audio.ogg', contentType: 'audio/ogg' } :
            magicHex === '52494646' ? { filename: 'audio.wav', contentType: 'audio/wav' } :
            null;
        const filename =
            safeMimeType.includes('ogg') ? 'audio.ogg' :
            safeMimeType.includes('webm') ? 'audio.webm' :
            safeMimeType.includes('wav') ? 'audio.wav' :
            safeMimeType.includes('mpeg') ? 'audio.mp3' :
            'audio.webm';
        const formData = new FormData();
        const finalFilename = detected?.filename ?? filename;
        const finalContentType = detected?.contentType ?? safeMimeType;
        console.log("Transcribe upload:", { bytes: buffer.length, mimeType: safeMimeType, magicHex, finalContentType, finalFilename });
        formData.append('file', buffer, { filename: finalFilename, contentType: finalContentType });
        formData.append('model', 'whisper-1');
        formData.append('language', 'en');
        formData.append('prompt', 'This is a conversation in English. If you hear silence or background noise, do not transcribe anything. Ignore phrases like "Thank you for watching" or video subtitles.');

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
