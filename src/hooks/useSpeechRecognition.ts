import { useState, useEffect, useCallback, useRef } from 'react';
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
    startListening: () => void;
    stopListening: () => void;
    resetTranscript: () => void;
    browserSupportsSpeechRecognition: boolean;
    updateHistory: (id: string, updates: Partial<Utterance>) => void;
    mode: 'native' | 'universal';
}

export const useSpeechRecognition = (): SpeechRecognitionHook => {

    // --- State ---
    const [isListening, setIsListening] = useState(false);
    const [currentInterim, setCurrentInterim] = useState('');
    const [history, setHistory] = useState<Utterance[]>([]);

    // System Selection
    const hasNativeSupport = !!(window.SpeechRecognition || window.webkitSpeechRecognition);

    // --- Native Logic ---
    const [recognition, setRecognition] = useState<any>(null);
    const isListeningRef = useRef(false);
    const lastUtteranceTime = useRef<number>(Date.now());
    const currentSpeakerId = useRef<number>(1);

    // --- Polyfill Logic (Universal Mode) ---
    const { startRecording, stopRecording, isSupported: hasMicSupport } = useAudioRecorder();
    const isPolyfillLoopActive = useRef(false);

    // --- Helper: Add Text to History ---
    const addTextToHistory = useCallback((text: string) => {
        if (!text) return;
        const now = Date.now();
        const timeSinceLast = now - lastUtteranceTime.current;
        let speakerChanged = false;

        if (timeSinceLast > 5000) {
            currentSpeakerId.current = currentSpeakerId.current === 1 ? 2 : 1;
            speakerChanged = true;
        }

        lastUtteranceTime.current = now;

        setHistory(prev => {
            const lastItem = prev[prev.length - 1];
            if (lastItem && !speakerChanged && timeSinceLast < 2500) {
                return prev.map((item, idx) => {
                    if (idx === prev.length - 1) {
                        return { ...item, text: item.text + " " + text, timestamp: now, translation: undefined };
                    }
                    return item;
                });
            } else {
                const newId = Date.now().toString() + Math.random().toString().slice(2, 5);
                return [...prev, {
                    id: newId,
                    text: text,
                    timestamp: now,
                    isFinal: true,
                    sender: currentSpeakerId.current === 1 ? 'other' : 'user'
                }];
            }
        });
    }, []);

    // --- Helper: Transcribe Audio Blob ---
    const transcribeBlob = async (blob: Blob) => {
        try {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64Audio = (reader.result as string).split(',')[1];
                const response = await fetch('/api/transcribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ audio: base64Audio })
                });
                const data = await response.json();
                if (data && data.text) {
                    addTextToHistory(data.text);
                }
            };
            reader.readAsDataURL(blob);
        } catch (e) {
            console.error("Transcription failed", e);
        }
    };


    // --- Setup Native Recognition ---
    useEffect(() => {
        if (hasNativeSupport) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const instance = new SpeechRecognition();
            instance.continuous = true;
            instance.interimResults = true;
            instance.lang = 'en-US';

            instance.onresult = (event: any) => {
                let interimTx = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        addTextToHistory(event.results[i][0].transcript.trim());
                    } else {
                        interimTx += event.results[i][0].transcript;
                    }
                }
                setCurrentInterim(interimTx);
            };

            instance.onend = () => {
                if (isListeningRef.current) {
                    try { instance.start(); } catch (e) { console.error(e); }
                } else {
                    setIsListening(false);
                }
            };

            instance.onerror = (e: any) => {
                if (e.error === 'not-allowed') setIsListening(false);
            }

            setRecognition(instance);
        }
    }, [hasNativeSupport, addTextToHistory]);

    // --- Control Functions ---

    // Loop for Polyfill Mode
    const runPolyfillLoop = useCallback(async () => {
        if (!isPolyfillLoopActive.current) return;

        // 1. Start Recording
        await startRecording();
        setIsListening(true);
        setCurrentInterim("Listening (Universal Mode)...");

        // 2. Wait X seconds (simulating segment) or until silence (simple timeout for now)
        // For a true conversational feel, we record chunks of 5 seconds
        // This is a naive implementation but works for fallback.
        setTimeout(async () => {
            if (!isPolyfillLoopActive.current) {
                await stopRecording(); // Just stop
                setIsListening(false);
                return;
            }

            // 3. Stop and Transcribe
            setCurrentInterim("Processing...");
            const blob = await stopRecording();
            if (blob && blob.size > 0) {
                await transcribeBlob(blob);
            }
            setCurrentInterim("");

            // 4. Restart Loop if still active
            if (isPolyfillLoopActive.current) {
                runPolyfillLoop();
            } else {
                setIsListening(false);
            }
        }, 5000); // 5 second turn
    }, [startRecording, stopRecording, addTextToHistory]);


    const startListening = useCallback(() => {
        isListeningRef.current = true;
        if (hasNativeSupport && recognition) {
            try { recognition.start(); setIsListening(true); } catch (e) { }
        } else if (hasMicSupport) {
            // Polyfill Start
            if (!isPolyfillLoopActive.current) {
                isPolyfillLoopActive.current = true;
                runPolyfillLoop();
            }
        }
    }, [hasNativeSupport, recognition, hasMicSupport, runPolyfillLoop]);

    const stopListening = useCallback(() => {
        isListeningRef.current = false;
        if (hasNativeSupport && recognition) {
            try { recognition.stop(); } catch (e) { }
            setIsListening(false);
        } else {
            // Polyfill Stop
            isPolyfillLoopActive.current = false;
            stopRecording().then(() => {
                // optionally transcribe last chunk, but let's just abort keeping it simple
                setIsListening(false);
                setCurrentInterim("");
            });
        }
    }, [hasNativeSupport, recognition, stopRecording]);


    return {
        isListening,
        currentInterim,
        history,
        startListening,
        stopListening,
        resetTranscript: () => setHistory([]),
        browserSupportsSpeechRecognition: true,
        updateHistory: (id, updates) => setHistory(p => p.map(i => i.id === id ? { ...i, ...updates } : i)),
        mode: hasNativeSupport ? 'native' : 'universal'
    };
};
