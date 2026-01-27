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
    const [forceUniversal, setForceUniversal] = useState(false);
    const hasNativeSupport = !!(window.SpeechRecognition || window.webkitSpeechRecognition) && !forceUniversal;

    // --- Native Logic ---
    const [recognition, setRecognition] = useState<any>(null);
    const nativeErrorCount = useRef(0);
    const isListeningRef = useRef(false);
    const lastUtteranceTime = useRef<number>(Date.now());
    const currentSpeakerId = useRef<number>(1);

    // --- Polyfill Logic (Universal Mode) ---
    const { startRecording, stopRecording, isSupported: hasMicSupport } = useAudioRecorder();
    const isPolyfillLoopActive = useRef(false);

    // --- Helper: Add Text to History ---
    const addTextToHistory = useCallback((text: string) => {
        if (!text) return;
        console.log("Adding text to history:", text);
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
            console.log("Transcribing blob of size:", blob.size);
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64Audio = (reader.result as string).split(',')[1];
                console.log("Sending to /api/transcribe...");
                const response = await fetch('/api/transcribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ audio: base64Audio })
                });
                
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Server error: ${response.status} - ${errorText}`);
                }

                const data = await response.json();
                console.log("Transcription response:", data);
                if (data && data.text) {
                    const cleanedText = data.text.trim();
                    
                    // Filter out common Whisper hallucinations on silence
                    const hallucinations = [
                        "MBC 뉴스", 
                        "MBC News", 
                        "신선한 경제", 
                        "이덕영입니다", 
                        "이학수입니다",
                        "Thank you for watching",
                        "Please subscribe",
                        "Subtitles by",
                        "Bye."
                    ];

                    const isHallucination = hallucinations.some(h => cleanedText.includes(h));
                    
                    if (!isHallucination && cleanedText.length > 1) {
                        addTextToHistory(cleanedText);
                    } else {
                        console.log("Ignored likely hallucination or empty text:", cleanedText);
                    }
                }
            };
            reader.readAsDataURL(blob);
        } catch (e) {
            console.error("Transcription failed:", e);
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

            instance.onstart = () => {
                console.log("Native Speech Recognition started.");
                setIsListening(true);
            };

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
                console.error("Speech Recognition Error:", e.error, e.message);
                
                if (e.error === 'not-allowed') {
                    setIsListening(false);
                    isListeningRef.current = false;
                }

                if (e.error === 'network') {
                    console.warn("Network error during native recognition. Switching to Universal Mode...");
                    nativeErrorCount.current += 1;
                    
                    if (nativeErrorCount.current >= 1) {
                        setForceUniversal(true);
                        // Seamless switch: if we were listening, start the polyfill immediately
                        if (isListeningRef.current) {
                            isPolyfillLoopActive.current = true;
                            runPolyfillLoop();
                        }
                    }
                }
            }

            setRecognition(instance);
        } else {
            if (recognition) {
                try { recognition.abort(); } catch(e) {}
                setRecognition(null);
            }
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
        console.log("startListening called. NativeSupport:", hasNativeSupport, "MicSupport:", hasMicSupport);
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
