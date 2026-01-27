import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import type { Suggestion } from '../hooks/useAIResponse';

interface SuggestionDockProps {
    suggestions: Suggestion[];
    isLoading: boolean;
    onSelect?: (text: string) => void;
    lastUserSpeech?: string;
    mode?: 'native' | 'universal';
    mobileTopRight?: React.ReactNode;
    accent?: 'primary' | 'lino';
}

export const SuggestionDock: React.FC<SuggestionDockProps> = ({ suggestions, isLoading, onSelect, lastUserSpeech, mode, mobileTopRight, accent = 'primary' }) => {
    // ... existing hook logic ... 
    // We maintain a history of previous suggestion sets
    const [stack, setStack] = useState<Suggestion[][]>([]);
    const [highlightIndex, setHighlightIndex] = useState(-1);

    const STOPWORDS = new Set([
        "a", "an", "and", "are", "as", "at", "be", "been", "but", "by", "can", "could", "did", "do", "does",
        "for", "from", "get", "got", "had", "has", "have", "how", "i", "im", "in", "into", "is", "it", "just",
        "like", "me", "my", "no", "not", "of", "on", "or", "so", "that", "the", "their", "them", "then", "there",
        "these", "they", "this", "to", "up", "was", "we", "were", "what", "when", "where", "who", "why", "with",
        "you", "your"
    ]);

    const ALWAYS_IMPORTANT = new Set([
        "ok", "okay", "yes", "no", "hi", "hey", "bye", "thanks", "thank", "please", "sorry", "yeah", "nah", "dont", "wont"
    ]);

    const normalizeToken = (t: string) => {
        const map: Record<string, string> = {
            "thx": "thanks",
            "pls": "please",
            "plz": "please",
            "u": "you",
            "ur": "your",
            "r": "are",
            "im": "i",
            "ive": "i",
            "id": "i"
        };
        return map[t] ?? t;
    };

    const cleanText = (s: string) => s.toLowerCase()
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "")
        .replace(/['"]/g, "")
        .replace(/\s{2,}/g, " ")
        .trim();

    const tokenizeForMatch = (s: string) => {
        const tokens = cleanText(s)
            .split(/\s+/)
            .map(t => t.trim())
            .map(normalizeToken)
            .filter(Boolean)
            .filter(t => t.length >= 2)
            .filter(t => ALWAYS_IMPORTANT.has(t) || !STOPWORDS.has(t));
        return tokens;
    };

    const tokenizeKeywords = (s: string) => {
        const tokens = cleanText(s)
            .split(/\s+/)
            .map(t => t.trim())
            .map(normalizeToken)
            .filter(Boolean)
            .filter(t => ALWAYS_IMPORTANT.has(t) || t.length >= 4)
            .filter(t => ALWAYS_IMPORTANT.has(t) || !STOPWORDS.has(t));
        return tokens;
    };

    const diceCoefficient = (a: string, b: string) => {
        const s = a.replace(/\s+/g, '');
        const u = b.replace(/\s+/g, '');
        if (!s || !u) return 0;
        if (s === u) return 1;
        if (s.length < 2 || u.length < 2) return 0;
        const getBigrams = (str: string) => {
            const bg = new Map<string, number>();
            for (let i = 0; i < str.length - 1; i++) {
                const key = str.substring(i, i + 2);
                bg.set(key, (bg.get(key) ?? 0) + 1);
            }
            return bg;
        };
        const sBg = getBigrams(s);
        const uBg = getBigrams(u);
        let intersection = 0;
        for (const [k, v] of sBg.entries()) {
            const uCount = uBg.get(k) ?? 0;
            intersection += Math.min(v, uCount);
        }
        const total = Array.from(sBg.values()).reduce((acc, v) => acc + v, 0) + Array.from(uBg.values()).reduce((acc, v) => acc + v, 0);
        return total > 0 ? (2 * intersection) / total : 0;
    };

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

        const getMatchScore = (suggestion: string) => {
            const sClean = cleanText(suggestion);
            const uClean = cleanText(lastUserSpeech);
            if (!sClean || !uClean) return 0;
            if (sClean === uClean) return 1.0;

            const sTokens = new Set(tokenizeForMatch(suggestion));
            const uTokens = new Set(tokenizeForMatch(lastUserSpeech));

            const charScore = diceCoefficient(sClean, uClean);

            if (sTokens.size === 0 || uTokens.size === 0) return charScore;

            let intersection = 0;
            uTokens.forEach(token => { if (sTokens.has(token)) intersection++; });
            const precision = sTokens.size > 0 ? intersection / sTokens.size : 0;
            const recall = uTokens.size > 0 ? intersection / uTokens.size : 0;
            const f1 = (precision + recall) > 0 ? (2 * precision * recall) / (precision + recall) : 0;

            const combined = Math.max(f1, charScore * 0.85);
            if (sClean.includes(uClean) || uClean.includes(sClean)) return Math.max(combined, 0.95);
            return combined;
        };

        let bestIdx = -1;
        let highest = 0;

        previousSet.forEach((item, idx) => {
            const score = getMatchScore(item.en);
            if (score > highest) {
                highest = score;
                bestIdx = idx;
            }
        });

        setHighlightIndex(highest >= 0.25 ? bestIdx : -1);

    }, [lastUserSpeech, previousSet]);

    // Word highlighting renderer
    const renderHighlightedText = (text: string) => {
        if (!lastUserSpeech) return <>{text}</>;
        const userWords = new Set(tokenizeKeywords(lastUserSpeech));

        return text.split(' ').map((word, i) => {
            const cleanWord = normalizeToken(cleanText(word));
            const isImportant = ALWAYS_IMPORTANT.has(cleanWord) || (cleanWord.length >= 4 && !STOPWORDS.has(cleanWord));
            const isHit = isImportant && userWords.has(cleanWord);

            return (
                <span
                    key={i}
                    className={
                        isHit
                            ? "text-yellow-400 font-bold"
                            : isImportant
                                ? "text-red-400 opacity-80"
                                : "text-slate-400"
                    }
                >
                    {word}{" "}
                </span>
            );
        });
    };

    return (
        <div className="w-full flex flex-col gap-4 min-h-[120px]">
            <div className="flex justify-end pr-2">
                {mobileTopRight ? (
                    <div className="md:hidden">{mobileTopRight}</div>
                ) : (
                    mode && (
                        <span className={cn("text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border",
                            mode === 'native' ? "bg-green-900/40 text-green-400 border-green-500/20" : "bg-blue-900/40 text-blue-400 border-blue-500/20"
                        )}>
                            {mode === 'native' ? '⚡ Native' : '🌐 Universal'}
                        </span>
                    )
                )}
            </div>

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
                                    "text-left p-4 rounded-xl glass-card border-l-4 shadow-lg",
                                    "hover:bg-white/10 transition-all duration-300",
                                    accent === 'lino'
                                        ? "border-[#0FB9B1]/25 border-l-[#0FB9B1]/70 hover:border-l-[#0FB9B1]"
                                        : "border-l-primary/50 hover:border-l-primary",
                                    "group flex flex-col items-start gap-1 w-full"
                                )}
                            >
                                <span className="text-lg text-slate-100 font-semibold leading-tight">{item.en}</span>
                                <span className="text-sm text-blue-300/80 italic font-light">{item.pt}</span>
                            </motion.button>
                        ))
                    ) : (
                        <div className={cn(
                            "h-40 flex items-center justify-center text-slate-500 italic border border-dashed rounded-xl",
                            accent === 'lino' ? "border-[#0FB9B1]/25" : "border-white/10"
                        )}>
                            Aguardando contexto...
                        </div>
                    )
                )}
            </div>

            {/* 2. PREVIOUS Suggestions (History - Bottom) */}
            <div className="hidden md:flex items-end gap-3 px-1 mt-2">
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
                                            : cn("bg-black/20", accent === 'lino' ? "border-[#0FB9B1]/15" : "border-white/5")
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
