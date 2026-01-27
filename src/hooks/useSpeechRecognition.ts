import { useState, useCallback, useRef } from 'react';
import { useAudioRecorder } from './useAudioRecorder';

export interface Utterance {
    id: string;
    text: string;
    translation?: string;
    timestamp: number;
    isFinal: boolean;
    sender?: 'user' | 'other';
}

export interface SpeechRecognitionHook {
    isListening: boolean;
    currentInterim: string;
    history: Utterance[];
    activeSpeaker: 'user' | 'other';
    setActiveSpeaker: (speaker: 'user' | 'other') => void;
    switchSpeaker: (speaker: 'user' | 'other') => void;
    beginUserTalk: () => void;
    endUserTalk: () => void;
    startListening: () => void;
    stopListening: () => void;
    resetTranscript: () => void;
    addUtterance: (text: string, sender: 'user' | 'other') => void;
    browserSupportsSpeechRecognition: boolean;
    updateHistory: (id: string, updates: Partial<Utterance>) => void;
    mode: 'native' | 'universal';
}

export const useSpeechRecognition = (options?: { sessionMode?: 'live' | 'practice' }): SpeechRecognitionHook => {

    // --- State ---
    const [isListening, setIsListening] = useState(false);
    const [currentInterim, setCurrentInterim] = useState('');
    const [history, setHistory] = useState<Utterance[]>([]);
    const [activeSpeaker, setActiveSpeakerState] = useState<'user' | 'other'>('other');

    // --- Refs ---
    const isListeningRef = useRef(false);
    const lastUtteranceTime = useRef<number>(Date.now());
    const isPolyfillLoopActive = useRef(false);
    const activeSpeakerRef = useRef<'user' | 'other'>('other');
    const inFlightTranscribesRef = useRef<Set<AbortController>>(new Set());
    const chunkWaitAbortRef = useRef<AbortController | null>(null);
    const CHUNK_MS = 1200;
    const USER_PAUSE_TOLERANCE_MS = 2000;
    const USER_MAX_HOLD_MS = 5 * 60 * 1000;
    const isPushToTalkActiveRef = useRef(false);
    const userReleaseAbortTimerRef = useRef<number | null>(null);
    const practiceFinalizeTimerRef = useRef<number | null>(null);
    const practiceDraftRef = useRef<string>('');
    const stopAfterThisChunkRef = useRef(false);

    const sessionMode: 'live' | 'practice' = options?.sessionMode ?? 'live';

    const setActiveSpeaker = useCallback((speaker: 'user' | 'other') => {
        activeSpeakerRef.current = speaker;
        setActiveSpeakerState(speaker);
    }, []);

    // --- Polyfill Logic (OpenAI Whisper) ---
    const { startRecording, stopRecording, isSupported: hasMicSupport } = useAudioRecorder();

    // --- Ultimate Hallucination Filter ---
    const isHallucination = (text: string): boolean => {
        const cleaned = text.trim().toLowerCase();
        
        // 1. Check for ANY non-Latin/Asian characters
        const hasAsianChars = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff66-\uff9f\uac00-\ud7af]/.test(text);
        if (hasAsianChars) return true;

        // 2. Strict blacklist
        const blacklisted = [
            "thank you for watching",
            "thanks for watching",
            "please subscribe",
            "subtitles by",
            "mbc news",
            "mbc 뉴스",
            "bye bye",
            "you",
            "you.",
            "bye.",
            "hello."
        ];
        if (blacklisted.some(phrase => cleaned === phrase || cleaned.includes(phrase))) return true;

        // 3. Latin-only Regex (Strict)
        const latinOnlyRegex = /^[a-zA-Z0-9\s.,!?;:'"()\-áàâãéèêíïóôõöúçÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇ]*$/;
        if (!latinOnlyRegex.test(text)) return true;

        // 4. Noise Filter (Too short or just punctuation)
        if (cleaned.length < 2) return true;
        if (/^[.,!?\s]+$/.test(cleaned)) return true;

        return false;
    };

    // --- Helper: Add Text to History ---
    const addTextToHistory = useCallback((text: string, senderOverride?: 'user' | 'other') => {
        if (!text || isHallucination(text)) return;

        const cleanedText = text.trim();
        const senderCandidate = senderOverride ?? activeSpeakerRef.current;
        if (senderCandidate === 'other') {
            const wordCount = cleanedText.split(/\s+/).filter(Boolean).length;
            if (cleanedText.length < 8 || wordCount < 2) return;
        }

        const now = Date.now();
        const timeSinceLast = now - lastUtteranceTime.current;
        const sender = senderCandidate;

        lastUtteranceTime.current = now;

        setHistory(prev => {
            const lastItem = prev[prev.length - 1];

            if (lastItem && lastItem.sender === sender && timeSinceLast < 2500) {
                return prev.map((item, idx) => {
                    if (idx === prev.length - 1) {
                        return { ...item, text: item.text + " " + text, timestamp: now, translation: undefined };
                    }
                    return item;
                });
            }

            const newId = Date.now().toString() + Math.random().toString().slice(2, 5);
            return [...prev, {
                id: newId,
                text: text,
                timestamp: now,
                isFinal: true,
                sender
            }];
        });
    }, [sessionMode]);

    const addUtterance = useCallback((text: string, sender: 'user' | 'other') => {
        const cleaned = text.trim();
        if (!cleaned) return;

        const now = Date.now();
        const newId = Date.now().toString() + Math.random().toString().slice(2, 5);
        lastUtteranceTime.current = now;

        setHistory(prev => [...prev, {
            id: newId,
            text: cleaned,
            timestamp: now,
            isFinal: true,
            sender
        }]);
    }, []);

    const appendPracticeDraft = useCallback((text: string) => {
        const cleaned = text.trim();
        if (!cleaned) return;

        practiceDraftRef.current = practiceDraftRef.current
            ? `${practiceDraftRef.current} ${cleaned}`
            : cleaned;

        setCurrentInterim(practiceDraftRef.current);

        if (practiceFinalizeTimerRef.current) {
            clearTimeout(practiceFinalizeTimerRef.current);
            practiceFinalizeTimerRef.current = null;
        }

        practiceFinalizeTimerRef.current = window.setTimeout(() => {
            const finalText = practiceDraftRef.current.trim();
            if (!finalText) return;
            practiceDraftRef.current = '';
            setCurrentInterim('');
            addUtterance(finalText, 'user');
        }, USER_PAUSE_TOLERANCE_MS);
    }, [addUtterance]);

    const finalizePracticeDraft = useCallback(() => {
        const finalText = practiceDraftRef.current.trim();
        if (!finalText) return;
        practiceDraftRef.current = '';
        setCurrentInterim('');
        addUtterance(finalText, 'user');
    }, [addUtterance]);

    // --- Transcription Logic ---
    const transcribeBlob = useCallback(async (blob: Blob, senderForChunk: 'user' | 'other') => {
        try {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const controller = new AbortController();
                inFlightTranscribesRef.current.add(controller);

                try {
                    const base64Audio = (reader.result as string).split(',')[1];
                    const response = await fetch('/api/transcribe', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ audio: base64Audio, mimeType: blob.type }),
                        signal: controller.signal
                    });

                    if (response.ok) {
                        const data = await response.json();
                        if (data && data.text) {
                            if (sessionMode === 'practice' && senderForChunk === 'user') {
                                appendPracticeDraft(data.text);
                            } else {
                                addTextToHistory(data.text, senderForChunk);
                            }
                        }
                    }
                } catch (e: any) {
                    if (e?.name !== 'AbortError') {
                        console.error("Transcribe request failed:", e);
                    }
                } finally {
                    inFlightTranscribesRef.current.delete(controller);
                }
            };
            reader.readAsDataURL(blob);
        } catch (e) {
            console.error("Transcription failed:", e);
        }
    }, [addTextToHistory, appendPracticeDraft, sessionMode]);

    const runPolyfillLoop = useCallback(async () => {
        if (!isPolyfillLoopActive.current) return;
        try {
            const senderForChunk = activeSpeakerRef.current;
            await startRecording();
            setIsListening(true);
            if (!(sessionMode === 'practice' && senderForChunk === 'user')) {
                setCurrentInterim("Listening...");
            }

            const chunkAbort = new AbortController();
            chunkWaitAbortRef.current?.abort();
            chunkWaitAbortRef.current = chunkAbort;

            await new Promise<void>((resolve) => {
                const shouldHoldForPushToTalk =
                    senderForChunk === 'user' &&
                    isPushToTalkActiveRef.current &&
                    (sessionMode === 'live' || sessionMode === 'practice');
                const waitMs = shouldHoldForPushToTalk ? USER_MAX_HOLD_MS : CHUNK_MS;
                const t = setTimeout(resolve, waitMs);
                chunkAbort.signal.addEventListener('abort', () => {
                    clearTimeout(t);
                    resolve();
                }, { once: true });
            });

            if (!isPolyfillLoopActive.current) {
                await stopRecording(true);
                setIsListening(false);
                return;
            }

            if (!(sessionMode === 'practice' && senderForChunk === 'user')) {
                setCurrentInterim("Thinking...");
            }
            const { blob, maxRms } = await stopRecording(false);

            const VAD_RMS_THRESHOLD = senderForChunk === 'other' ? 0.028 : 0.009;
            const MIN_BLOB_SIZE = senderForChunk === 'other' ? 2200 : 300;
            if (blob && blob.size > MIN_BLOB_SIZE && maxRms >= VAD_RMS_THRESHOLD) {
                transcribeBlob(blob, senderForChunk);
            }
            if (!(sessionMode === 'practice' && senderForChunk === 'user')) {
                setCurrentInterim("");
            }

            if (stopAfterThisChunkRef.current) {
                stopAfterThisChunkRef.current = false;
                isPolyfillLoopActive.current = false;
                await stopRecording(true);
                setIsListening(false);
                setCurrentInterim("");
                return;
            }

            if (isPolyfillLoopActive.current) runPolyfillLoop();
        } catch (error) {
            console.error("Loop Error:", error);
            setIsListening(false);
            isPolyfillLoopActive.current = false;
        }
    }, [CHUNK_MS, sessionMode, startRecording, stopRecording, transcribeBlob]);

    // --- External Controls ---
    const startListening = useCallback(() => {
        console.log("Start Listening (Whisper Only)");
        isListeningRef.current = true;
        if (hasMicSupport) {
            if (isPolyfillLoopActive.current) return;
            if (sessionMode === 'practice') {
                setActiveSpeaker('user');
                practiceDraftRef.current = '';
                if (practiceFinalizeTimerRef.current) {
                    clearTimeout(practiceFinalizeTimerRef.current);
                    practiceFinalizeTimerRef.current = null;
                }
                setCurrentInterim('');
            }
            isPolyfillLoopActive.current = true;
            runPolyfillLoop();
        }
    }, [hasMicSupport, runPolyfillLoop, sessionMode, setActiveSpeaker]);

    const beginUserTalk = useCallback(() => {
        setActiveSpeaker('user');
        isPushToTalkActiveRef.current = true;
        stopAfterThisChunkRef.current = false;
        if (userReleaseAbortTimerRef.current) {
            clearTimeout(userReleaseAbortTimerRef.current);
            userReleaseAbortTimerRef.current = null;
        }
    }, [setActiveSpeaker]);

    const endUserTalk = useCallback(() => {
        isPushToTalkActiveRef.current = false;
        setActiveSpeaker('other');
        stopAfterThisChunkRef.current = true;
        chunkWaitAbortRef.current?.abort();
    }, [setActiveSpeaker]);

    const switchSpeaker = useCallback((speaker: 'user' | 'other') => {
        if (sessionMode === 'practice') return;
        setActiveSpeaker(speaker);
        if (speaker === 'user') {
            isPushToTalkActiveRef.current = true;
            if (userReleaseAbortTimerRef.current) {
                clearTimeout(userReleaseAbortTimerRef.current);
                userReleaseAbortTimerRef.current = null;
            }
            chunkWaitAbortRef.current?.abort();
            return;
        }

        isPushToTalkActiveRef.current = false;
        if (userReleaseAbortTimerRef.current) {
            clearTimeout(userReleaseAbortTimerRef.current);
            userReleaseAbortTimerRef.current = null;
        }
        userReleaseAbortTimerRef.current = window.setTimeout(() => {
            if (isPushToTalkActiveRef.current) return;
            chunkWaitAbortRef.current?.abort();
        }, USER_PAUSE_TOLERANCE_MS);
    }, [setActiveSpeaker, sessionMode]);

    const stopListening = useCallback(() => {
        console.log("Stop Listening");
        isListeningRef.current = false;
        isPolyfillLoopActive.current = false;
        chunkWaitAbortRef.current?.abort();
        chunkWaitAbortRef.current = null;
        if (userReleaseAbortTimerRef.current) {
            clearTimeout(userReleaseAbortTimerRef.current);
            userReleaseAbortTimerRef.current = null;
        }
        if (practiceFinalizeTimerRef.current) {
            clearTimeout(practiceFinalizeTimerRef.current);
            practiceFinalizeTimerRef.current = null;
        }
        if (sessionMode === 'practice') {
            finalizePracticeDraft();
        }
        inFlightTranscribesRef.current.forEach(c => c.abort());
        inFlightTranscribesRef.current.clear();

        stopRecording(true).then(() => {
            setIsListening(false);
            setCurrentInterim("");
        });
    }, [finalizePracticeDraft, sessionMode, stopRecording]);

    return {
        isListening,
        currentInterim,
        history,
        activeSpeaker,
        setActiveSpeaker,
        switchSpeaker,
        beginUserTalk,
        endUserTalk,
        startListening,
        stopListening,
        resetTranscript: () => setHistory([]),
        addUtterance,
        browserSupportsSpeechRecognition: true,
        updateHistory: (id, updates) => setHistory(p => p.map(i => i.id === id ? { ...i, ...updates } : i)),
        mode: 'universal'
    };
};
