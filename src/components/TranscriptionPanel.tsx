import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { Mic } from 'lucide-react';
import type { Utterance } from '../hooks/useSpeechRecognition';

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

                    {/* History Bubbles */}
                    {history.map((item) => {
                        const isSpeakerA = item.sender === 'other'; // Voice 1 (Default/Other)
                        const isUser = item.sender === 'user';

                        return (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                onClick={() => {
                                    if (!isUser) return;
                                    onSwitchSpeaker(item.id, item.sender);
                                }}
                                title={isUser ? "Clique para corrigir" : undefined}
                                className={cn(
                                    "max-w-[85%] p-4 rounded-2xl shadow-md border flex flex-col gap-1 transition-transform hover:scale-[1.01] active:scale-[0.98]",
                                    isUser ? "cursor-pointer" : "cursor-default",
                                    isSpeakerA
                                        ? "self-start rounded-tl-sm bg-indigo-950/40 border-indigo-500/30 text-indigo-100 hover:bg-indigo-900/40" // Speaker A Style
                                        : "self-end rounded-tr-sm bg-emerald-950/40 border-emerald-500/30 text-emerald-100 hover:bg-emerald-900/40"   // Speaker B Style
                                )}
                            >
                                <p className="text-lg md:text-xl font-medium leading-relaxed">
                                    {item.text}
                                </p>

                                {/* Translation Section */}
                                {item.translation && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className={cn(
                                            "mt-2 pt-2 border-t text-sm md:text-base italic",
                                            isSpeakerA ? "border-indigo-500/20 text-indigo-300" : "border-emerald-500/20 text-emerald-300"
                                        )}
                                    >
                                        <p>{item.translation}</p>
                                    </motion.div>
                                )}
                            </motion.div>
                        );
                    })}

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
