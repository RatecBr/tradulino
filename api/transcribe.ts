
import type { VercelRequest, VercelResponse } from '@vercel/node';
import FormData from 'form-data';
import fetch from 'node-fetch';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'Missing OpenAI API Key' });
    }

    try {
        const { audio } = req.body; // Expecting base64 string
        if (!audio) {
            return res.status(400).json({ error: 'No audio data provided' });
        }

        // Convert Base64 to Buffer
        const buffer = Buffer.from(audio, 'base64');

        // Create FormData for OpenAI
        const formData = new FormData();
        formData.append('file', buffer, { filename: 'recording.webm', contentType: 'audio/webm' });
        formData.append('model', 'whisper-1');
        formData.append('language', 'en'); 
        formData.append('prompt', 'Transcribe this English conversation. If there is silence, return nothing.');

        // Call Whisper API
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
        return res.status(200).json({ text: data.text });

    } catch (error) {
        console.error("Transcribe Handler Error", error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
