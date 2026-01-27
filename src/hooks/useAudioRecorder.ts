
import { useState, useRef, useCallback } from 'react';

export const useAudioRecorder = () => {
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorder = useRef<MediaRecorder | null>(null);
    const chunks = useRef<Blob[]>([]);

    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder.current = new MediaRecorder(stream); // Default mimeType
            chunks.current = [];

            mediaRecorder.current.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunks.current.push(e.data);
                }
            };

            mediaRecorder.current.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Mic access denied or not supported", err);
        }
    }, []);

    const stopRecording = useCallback(async (): Promise<Blob | null> => {
        return new Promise((resolve) => {
            if (!mediaRecorder.current || mediaRecorder.current.state === 'inactive') {
                return resolve(null);
            }

            mediaRecorder.current.onstop = () => {
                const blob = new Blob(chunks.current, { type: 'audio/webm' });
                chunks.current = [];
                setIsRecording(false);

                // Stop all tracks
                mediaRecorder.current?.stream.getTracks().forEach(track => track.stop());

                resolve(blob);
            };

            mediaRecorder.current.stop();
        });
    }, []);

    return {
        isRecording,
        startRecording,
        stopRecording,
        isSupported: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
    };
};
