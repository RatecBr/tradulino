import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic } from 'lucide-react';
import type { Utterance } from '../hooks/useSpeechRecognition';
import { MessageBubble } from './MessageBubble';

interface TranscriptionPanelProps {
    history: Utterance[];
    currentInterim: string;
    onSwitchSpeaker: (id: string, currentSender: 'user' | 'other' | undefined) => void;
}

export const TranscriptionPanel: React.FC<TranscriptionPanelProps> = ({
    history,
    currentInterim,
    onSwitchSpeaker
}) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [history, currentInterim]);

    return (
        <div className="flex flex-col h-full relative p-6">
            {/* Header Removed (Mic is in footer now) */}

            {/* Main Chat Area */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto custom-scrollbar rounded-2xl p-4 glass-card relative flex flex-col gap-4"
            >
                <AnimatePresence initial={false}>
                    {/* Empty State */}
                    {history.length === 0 && !currentInterim && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground opacity-40 pointer-events-none">
                            <Mic className="w-12 h-12 mb-2" />
                            <p>Conversa iniciada...</p>
                        </div>
                    )}

                    {history.map((item) => (
                        <MessageBubble
                            key={item.id}
                            item={item}
                            onSwitchSpeaker={onSwitchSpeaker}
                        />
                    ))}

                    {/* Live Interim Bubble */}
                    {currentInterim && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="self-center max-w-[85%] p-4 rounded-2xl bg-white/5 border-2 border-slate-500/30 border-dashed"
                        >
                            <p className="text-xl text-slate-400 font-medium leading-relaxed italic">
                                {currentInterim}...
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
