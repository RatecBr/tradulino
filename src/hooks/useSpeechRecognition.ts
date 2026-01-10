import { useState, useEffect, useCallback, useRef } from 'react';

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
}

export const useSpeechRecognition = (): SpeechRecognitionHook => {
    const [isListening, setIsListening] = useState(false);
    const [currentInterim, setCurrentInterim] = useState('');
    const [history, setHistory] = useState<Utterance[]>([]);
    const [recognition, setRecognition] = useState<any>(null);
    const isListeningRef = useRef(false); // Track intent independent of closure
    // Track last timestamp to determine speaker turns
    const lastUtteranceTime = useRef<number>(Date.now());
    const currentSpeakerId = useRef<number>(1); // 1 or 2

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognitionInstance = new SpeechRecognition();
            recognitionInstance.continuous = true;
            recognitionInstance.interimResults = true;
            recognitionInstance.lang = 'en-US';

            recognitionInstance.onresult = (event: any) => {
                let interimTx = '';

                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        const finalText = event.results[i][0].transcript.trim();
                        if (finalText) {
                            const now = Date.now();
                            const timeSinceLast = now - lastUtteranceTime.current;
                            let speakerChanged = false;

                            // Heuristic: If pause > 5 seconds, assume speaker switch
                            if (timeSinceLast > 5000) {
                                currentSpeakerId.current = currentSpeakerId.current === 1 ? 2 : 1;
                                speakerChanged = true;
                            }

                            lastUtteranceTime.current = now;

                            setHistory(prev => {
                                const lastItem = prev[prev.length - 1];
                                // Merge condition: Short pause (< 2.5s), no speaker change, and last item exists
                                if (lastItem && !speakerChanged && timeSinceLast < 2500) {
                                    // Merge with previous
                                    return prev.map((item, idx) => {
                                        if (idx === prev.length - 1) {
                                            return {
                                                ...item,
                                                text: item.text + " " + finalText,
                                                timestamp: now,
                                                translation: undefined // Invalidate translation to trigger re-translate
                                            };
                                        }
                                        return item;
                                    });
                                } else {
                                    // New bubble
                                    const newId = Date.now().toString() + Math.random().toString().slice(2, 5);
                                    return [...prev, {
                                        id: newId,
                                        text: finalText,
                                        timestamp: now,
                                        isFinal: true,
                                        sender: currentSpeakerId.current === 1 ? 'other' : 'user'
                                    }];
                                }
                            });
                        }
                    } else {
                        interimTx += event.results[i][0].transcript;
                    }
                }
                setCurrentInterim(interimTx);
            };

            recognitionInstance.onend = () => {
                // Auto-restart if user intent is still 'listening'
                if (isListeningRef.current) {
                    console.log("Auto-restarting speech recognition...");
                    try {
                        recognitionInstance.start();
                    } catch (e) {
                        console.error("Restart fail", e);
                    }
                } else {
                    setIsListening(false);
                }
            };

            recognitionInstance.onerror = (event: any) => {
                console.error("Speech error", event.error);
                if (event.error === 'not-allowed' || event.error === 'aborted') {
                    setIsListening(false);
                    isListeningRef.current = false;
                }
            };

            setRecognition(recognitionInstance);
        }
    }, []); // Dependencies empty -> stable initialization

    const startListening = useCallback(() => {
        if (recognition) {
            try {
                isListeningRef.current = true;
                recognition.start();
                setIsListening(true);
            } catch (e) {
                // Ignore start id already started
            }
        }
    }, [recognition]);

    const stopListening = useCallback(() => {
        if (recognition) {
            isListeningRef.current = false;
            try {
                recognition.stop();
            } catch (e) {
                console.warn("Stop failed", e);
            }
            setIsListening(false);
        }
    }, [recognition]);

    const resetTranscript = useCallback(() => {
        setHistory([]);
        setCurrentInterim('');
    }, []);

    const updateHistory = useCallback((id: string, updates: Partial<Utterance>) => {
        setHistory(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
    }, []);

    return {
        isListening,
        currentInterim,
        history,
        startListening,
        stopListening,
        resetTranscript,
        browserSupportsSpeechRecognition: !!(window.SpeechRecognition || window.webkitSpeechRecognition),
        updateHistory
    };
};
