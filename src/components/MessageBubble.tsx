import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import type { Utterance } from '../hooks/useSpeechRecognition';

interface MessageBubbleProps {
    item: Utterance;
    onSwitchSpeaker?: (id: string, currentSender: 'user' | 'other' | undefined) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = React.memo(({ item, onSwitchSpeaker }) => {
    const isSpeakerA = item.sender === 'other';
    const isUser = item.sender === 'user';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            onClick={() => {
                if (!isUser) return;
                onSwitchSpeaker?.(item.id, item.sender);
            }}
            title={isUser ? "Clique para corrigir" : undefined}
            className={cn(
                "max-w-[85%] p-4 rounded-2xl shadow-md border flex flex-col gap-1 transition-transform hover:scale-[1.01] active:scale-[0.98]",
                isUser ? "cursor-pointer" : "cursor-default",
                isSpeakerA
                    ? "self-start rounded-tl-sm bg-indigo-950/40 border-indigo-500/30 text-indigo-100 hover:bg-indigo-900/40"
                    : "self-end rounded-tr-sm bg-emerald-950/40 border-emerald-500/30 text-emerald-100 hover:bg-emerald-900/40"
            )}
        >
            <p className="text-lg md:text-xl font-medium leading-relaxed">
                {item.text}
            </p>

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
});

MessageBubble.displayName = 'MessageBubble';
