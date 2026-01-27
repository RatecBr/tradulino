import { useState, useRef, useCallback } from 'react';

export const useAudioRecorder = () => {
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorder = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const chunks = useRef<Blob[]>([]);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const maxRmsRef = useRef<number>(0);
    const currentRmsRef = useRef<number>(0);
    const rafRef = useRef<number | null>(null);
    const mimeTypeRef = useRef<string>('audio/webm');

    const startRecording = useCallback(async () => {
        try {
            // Mantém o stream aberto para evitar que o ícone do microfone pisque
            if (!streamRef.current || !streamRef.current.active) {
                streamRef.current = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true,
                        channelCount: 1
                    }
                });
            }

            if (!audioContextRef.current) {
                audioContextRef.current = new AudioContext();
            }
            if (audioContextRef.current.state === 'suspended') {
                try { await audioContextRef.current.resume(); } catch { }
            }

            if (!analyserRef.current) {
                const ctx = audioContextRef.current;
                const source = ctx.createMediaStreamSource(streamRef.current);
                const analyser = ctx.createAnalyser();
                analyser.fftSize = 2048;
                source.connect(analyser);
                analyserRef.current = analyser;
            }

            maxRmsRef.current = 0;
            currentRmsRef.current = 0;

            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            }

            const measure = () => {
                const analyser = analyserRef.current;
                const recorder = mediaRecorder.current;
                if (!analyser || !recorder || recorder.state !== 'recording') return;

                const buffer = new Uint8Array(analyser.fftSize);
                analyser.getByteTimeDomainData(buffer);

                let sumSquares = 0;
                for (let i = 0; i < buffer.length; i++) {
                    const v = (buffer[i] - 128) / 128;
                    sumSquares += v * v;
                }
                const rms = Math.sqrt(sumSquares / buffer.length);
                currentRmsRef.current = rms;
                if (rms > maxRmsRef.current) maxRmsRef.current = rms;

                rafRef.current = requestAnimationFrame(measure);
            };

            if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
                setIsRecording(true);
                rafRef.current = requestAnimationFrame(measure);
                return;
            }

            mediaRecorder.current = new MediaRecorder(streamRef.current);
            mimeTypeRef.current = (mediaRecorder.current.mimeType || 'audio/webm').split(';')[0].trim() || 'audio/webm';
            chunks.current = [];

            mediaRecorder.current.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunks.current.push(e.data);
                }
            };

            mediaRecorder.current.start();
            setIsRecording(true);
            rafRef.current = requestAnimationFrame(measure);
        } catch (err) {
            console.error("Mic access denied or not supported", err);
        }
    }, []);

    const stopRecording = useCallback(async (shouldStopStream = false): Promise<{ blob: Blob | null; maxRms: number; mimeType: string }> => {
        return new Promise((resolve) => {
            if (!mediaRecorder.current || mediaRecorder.current.state === 'inactive') {
                if (shouldStopStream && streamRef.current) {
                    streamRef.current.getTracks().forEach(track => track.stop());
                    streamRef.current = null;

                    if (analyserRef.current) {
                        try { analyserRef.current.disconnect(); } catch { }
                        analyserRef.current = null;
                    }

                    if (audioContextRef.current) {
                        audioContextRef.current.close().catch(() => undefined);
                        audioContextRef.current = null;
                    }
                }

                if (rafRef.current) {
                    cancelAnimationFrame(rafRef.current);
                    rafRef.current = null;
                }

                setIsRecording(false);
                return resolve({ blob: null, maxRms: 0, mimeType: mimeTypeRef.current });
            }

            mediaRecorder.current.onstop = () => {
                const mimeType = mimeTypeRef.current || 'audio/webm';
                const blob = new Blob(chunks.current, { type: mimeType });
                const maxRms = maxRmsRef.current;
                chunks.current = [];
                setIsRecording(false);

                if (rafRef.current) {
                    cancelAnimationFrame(rafRef.current);
                    rafRef.current = null;
                }

                if (shouldStopStream && streamRef.current) {
                    streamRef.current.getTracks().forEach(track => track.stop());
                    streamRef.current = null;

                    if (analyserRef.current) {
                        try { analyserRef.current.disconnect(); } catch { }
                        analyserRef.current = null;
                    }

                    if (audioContextRef.current) {
                        audioContextRef.current.close().catch(() => undefined);
                        audioContextRef.current = null;
                    }
                }

                resolve({ blob, maxRms, mimeType });
            };

            mediaRecorder.current.stop();
        });
    }, []);

    return {
        isRecording,
        startRecording,
        stopRecording,
        getCurrentRms: () => currentRmsRef.current,
        isSupported: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
    };
};
