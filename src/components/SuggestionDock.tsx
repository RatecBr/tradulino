import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import type { Suggestion } from '../hooks/useAIResponse';

interface SuggestionDockProps {
    suggestions: Suggestion[];
    isLoading: boolean;
    onSelect?: (text: string) => void;
    lastUserSpeech?: string; // New prop for matching
}

export const SuggestionDock: React.FC<SuggestionDockProps> = ({ suggestions, isLoading, onSelect, lastUserSpeech }) => {
    // We maintain a history of previous suggestion sets
    const [stack, setStack] = useState<Suggestion[][]>([]);
    const [highlightIndex, setHighlightIndex] = useState(-1);

    useEffect(() => {
        if (suggestions.length > 0) {
            setStack(prev => {
                const newStack = [suggestions, ...prev];
                return newStack.slice(0, 2); // Keep current + 1 previous set
            });
        }
    }, [suggestions]);

    const currentSet = stack[0] || [];
    const previousSet = stack[1] || [];

    // Calculate highlighting whenever data changes
    useEffect(() => {
        if (!lastUserSpeech || previousSet.length === 0) {
            setHighlightIndex(-1);
            return;
        }

        const cleanText = (s: string) => s.toLowerCase()
            .replace(/[\u2018\u2019]/g, "")
            .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "")
            .replace(/['"]/g, "")
            .replace(/\s{2,}/g, " ")
            .trim();

        const getMatchScore = (suggestion: string) => {
            const sClean = cleanText(suggestion);
            const uClean = cleanText(lastUserSpeech);

            if (!sClean || !uClean) return 0;
            if (sClean === uClean) return 1.0;

            // 1. Jaccard
            const getJaccard = () => {
                const sTokens = new Set(sClean.split(" ").filter(w => w.length > 0));
                const uTokens = new Set(uClean.split(" ").filter(w => w.length > 0));
                if (sTokens.size === 0 || uTokens.size === 0) return 0;

                let intersection = 0;
                sTokens.forEach(token => { if (uTokens.has(token)) intersection++; });
                const union = new Set([...sTokens, ...uTokens]).size;
                return intersection / union;
            };

            // 2. Dice
            const getDice = () => {
                const s = sClean.replace(/\s+/g, '');
                const u = uClean.replace(/\s+/g, '');
                if (s.length < 2 || u.length < 2) return 0;
                const getBigrams = (str: string) => {
                    const bg = new Set<string>();
                    for (let i = 0; i < str.length - 1; i++) bg.add(str.substring(i, i + 2));
                    return bg;
                };
                const sBg = getBigrams(s);
                const uBg = getBigrams(u);
                let intersection = 0;
                sBg.forEach(b => { if (uBg.has(b)) intersection++; });
                return (2 * intersection) / (sBg.size + uBg.size);
            };

            return Math.max(getJaccard(), getDice());
        };

        let bestIdx = -1;
        let highest = 0;

        previousSet.forEach((item, idx) => {
            const score = getMatchScore(item.en);
            if (score > highest && score > 0.3) {
                highest = score;
                bestIdx = idx;
            }
        });

        setHighlightIndex(bestIdx);

    }, [lastUserSpeech, previousSet]);

    // Word highlighting renderer
    const renderHighlightedText = (text: string) => {
        if (!lastUserSpeech) return <>{text}</>;
        const userWords = new Set(lastUserSpeech.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean));

        return text.split(' ').map((word, i) => {
            const cleanWord = word.toLowerCase().replace(/[^a-z0-9]/g, '');
            const isHit = userWords.has(cleanWord);

            return (
                <span key={i} className={isHit ? "text-yellow-400 font-bold" : "text-red-400 opacity-80"}>
                    {word}{" "}
                </span>
            );
        });
    };

    return (
        <div className="w-full flex flex-col gap-4 min-h-[120px]">
            {/* 1. CURRENT Suggestions (Active - Top) */}
            <div className="grid gap-3 grid-cols-1 w-full relative z-20">
                {isLoading ? (
                    [1, 2].map((i) => (
                        <div key={i} className="h-20 rounded-xl glass-card animate-pulse bg-white/5" />
                    ))
                ) : (
                    currentSet.length > 0 ? (
                        currentSet.slice(0, 2).map((item, idx) => (
                            <motion.button
                                key={`curr-${idx}-${item.en}`}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                onClick={() => onSelect?.(item.en)}
                                className={cn(
                                    "text-left p-4 rounded-xl glass-card border-l-4 border-l-primary/50 shadow-lg",
                                    "hover:border-l-primary hover:bg-white/10 transition-all duration-300",
                                    "group flex flex-col items-start gap-1 w-full"
                                )}
                            >
                                <span className="text-lg text-slate-100 font-semibold leading-tight">{item.en}</span>
                                <span className="text-sm text-blue-300/80 italic font-light">{item.pt}</span>
                            </motion.button>
                        ))
                    ) : (
                        <div className="h-40 flex items-center justify-center text-slate-500 italic border border-dashed border-white/10 rounded-xl">
                            Aguardando contexto...
                        </div>
                    )
                )}
            </div>

            {/* 2. PREVIOUS Suggestions (History - Bottom) */}
            <div className="flex items-end gap-3 px-1 mt-2">
                <div className="flex-1 flex flex-col gap-2 opacity-80">
                    {previousSet.length > 0 ? (
                        previousSet.slice(0, 2).map((item, idx) => {
                            const isWinner = idx === highlightIndex;
                            return (
                                <div
                                    key={`prev-${idx}`}
                                    data-speech={lastUserSpeech}
                                    className={cn(
                                        "p-3 border-b rounded-lg transition-colors duration-500",
                                        isWinner
                                            ? "bg-yellow-900/20 border-yellow-500/30 shadow-[0_0_10px_rgba(234,179,8,0.1)]"
                                            : "bg-black/20 border-white/5"
                                    )}
                                >
                                    <p className={cn(
                                        "text-sm font-medium leading-snug transition-colors",
                                        !isWinner && "text-slate-400"
                                    )}>
                                        {isWinner ? renderHighlightedText(item.en) : item.en}
                                    </p>
                                    <p className="text-xs text-slate-600 italic leading-snug mt-0.5">{item.pt}</p>
                                </div>
                            );
                        })
                    ) : (
                        <div className="h-10" />
                    )}
                </div>
            </div>
        </div>
    );
};
