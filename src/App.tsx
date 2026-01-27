import { useRef, useEffect, useState } from 'react'
import { Home } from 'lucide-react';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { useTranslation } from './hooks/useTranslation';
import { useAIResponse } from './hooks/useAIResponse';
import { useAIAutoReply } from './hooks/useAIAutoReply';
import { TranscriptionPanel } from './components/TranscriptionPanel';
import { SuggestionDock } from './components/SuggestionDock';
import { cn } from './lib/utils';
import { Logo } from './components/Logo';
import { LandingPage } from './components/LandingPage';

function App() {
  const [appMode, setAppMode] = useState<'live' | 'practice' | null>(null);
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(true);
  const [isTalkPressed, setIsTalkPressed] = useState(false);

  const {
    isListening,
    currentInterim,
    history,
    setActiveSpeaker,
    beginUserTalk,
    endUserTalk,
    startListening,
    stopListening,
    resetTranscript,
    updateHistory,
    addUtterance,
    mode
  } = useSpeechRecognition({ sessionMode: appMode === 'practice' ? 'practice' : 'live' });

  const { translateText } = useTranslation();
  const { suggestions, isLoading, generateSuggestions, resetSuggestions } = useAIResponse();
  const { generateReply } = useAIAutoReply();

  // Track processed items to avoid re-fetching
  const processingRef = useRef<Set<string>>(new Set());

  // Reactive Effect: Monitor history for new finalized items
  useEffect(() => {
    const lastItem = history[history.length - 1];

    // Only process if it's a FINAL item we haven't touched yet
    const processedKey = lastItem ? `${lastItem.id}:${lastItem.text}` : '';
    if (lastItem && lastItem.isFinal && !processingRef.current.has(processedKey)) {

      // Mark as processed
      processingRef.current.add(processedKey);

      // 1. Generate suggestions when the partner/AI speaks
      if (lastItem.sender === 'other') {
        generateSuggestions(lastItem.text, history);
      }

      // 2. Translate
      translateText(lastItem.text).then(translation => {
        updateHistory(lastItem.id, { translation });
      });

      // 3. Auto-reply only in Practice mode
      if (appMode === 'practice' && autoReplyEnabled && lastItem.sender === 'user') {
        generateReply(lastItem.text, history).then((reply) => {
          if (reply) addUtterance(reply, 'other');
        });
      }
    }
  }, [history, generateSuggestions, translateText, updateHistory, generateReply, addUtterance, appMode, autoReplyEnabled]);

  if (!appMode) {
    return <LandingPage onStart={(selectedMode) => {
      setAppMode(selectedMode);
      processingRef.current.clear();
      setAutoReplyEnabled(true);
      resetTranscript();
      resetSuggestions();
      setActiveSpeaker(selectedMode === 'practice' ? 'user' : 'other');
    }} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-primary/30 overflow-hidden relative">
      {/* Botão para voltar à Home */}
      <button 
        onClick={() => {
          if (isListening) stopListening();
          resetTranscript();
          resetSuggestions();
          setAppMode(null);
        }}
        className="fixed top-6 left-6 z-[100] flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-all active:scale-95"
      >
        <Home className="w-4 h-4" />
        <span className="text-sm font-medium">Voltar à Home</span>
      </button>

      {appMode === 'practice' && (
        <div className="fixed top-6 right-6 z-[100] flex items-center gap-3">
          <button
            onClick={() => setAutoReplyEnabled(v => !v)}
            className={cn(
              "px-3 py-2 border rounded-full text-xs font-semibold transition-all",
              autoReplyEnabled
                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-200 hover:bg-emerald-500/25"
                : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
            )}
          >
            {autoReplyEnabled ? 'Bot: ON' : 'Bot: OFF'}
          </button>
        </div>
      )}

      {/* Background Orbs */}
      <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] translate-x-1/2 translate-y-1/2 pointer-events-none" />
      {appMode === 'practice' && (
        <>
          <div className="fixed top-0 right-0 w-[620px] h-[620px] bg-[#0FB9B1]/15 rounded-full blur-[140px] translate-x-1/3 -translate-y-1/3 pointer-events-none" />
          <div className="fixed bottom-0 left-0 w-[620px] h-[620px] bg-[#0FB9B1]/10 rounded-full blur-[140px] -translate-x-1/3 translate-y-1/3 pointer-events-none" />
        </>
      )}

      {/* Main Content - Fixed Full Screen on Mobile */}
      <main className="flex flex-col md:flex-row relative z-10 w-full h-screen overflow-hidden">

        {/* Conversation Panel - Takes top 50% on mobile */}
        <section className="h-[50%] md:h-full flex-1 min-h-0 relative">
          <TranscriptionPanel
            history={history}
            currentInterim={currentInterim}
            onSwitchSpeaker={(id, currentSender) => {
              updateHistory(id, { sender: currentSender === 'user' ? 'other' : 'user' });
            }}
          />
        </section>

        {/* Brand Divider (Mobile Only) - Takes ~10% space visually */}
        <div className="shrink-0 flex justify-center items-center py-0 md:hidden opacity-40 pointer-events-none select-none z-50 -mt-10 mb-2">
          <Logo className="w-[85%] h-auto text-slate-300" />
        </div>

        {/* Suggestions Panel - Takes bottom 40% on mobile */}
        <section className="h-[40%] md:h-full shrink-0 md:w-1/3 flex flex-col min-h-0 z-20 bg-gradient-to-t from-black/90 via-slate-950/80 to-transparent md:bg-none pt-0">
          <div className="w-full h-full flex flex-col px-1 pb-1 pt-0 md:p-6">
            <SuggestionDock
              suggestions={suggestions}
              isLoading={isLoading}
                lastUserSpeech={[...history].reverse().find(h => h.sender === 'user' && h.isFinal)?.text}
              mode={mode}
              accent={appMode === 'practice' ? 'lino' : 'primary'}
              onSelect={(text) => addUtterance(text, 'user')}
              mobileTopRight={
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border",
                    isTalkPressed
                      ? "bg-emerald-900/30 text-emerald-300 border-emerald-500/20"
                      : "bg-white/5 text-slate-300 border-white/10"
                  )}>
                    {isTalkPressed ? 'Falando' : 'Segure FALAR'}
                  </span>
                </div>
              }
            />

            {(appMode === 'live' || appMode === 'practice') && (
              <button
                onPointerDown={(e) => {
                  try {
                    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                  } catch { }
                  setIsTalkPressed(true);
                  beginUserTalk();
                  if (!isListening) startListening();
                }}
                onPointerUp={(e) => {
                  try {
                    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
                  } catch { }
                  setIsTalkPressed(false);
                  endUserTalk();
                }}
                onPointerCancel={(e) => {
                  try {
                    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
                  } catch { }
                  setIsTalkPressed(false);
                  endUserTalk();
                }}
                className={cn(
                  "mt-4 md:mt-6 w-full rounded-2xl border text-center font-black tracking-widest select-none touch-none",
                  "py-6 md:py-5 text-3xl md:text-2xl transition-all active:scale-[0.99]",
                  appMode === 'practice' ? "border-[#0FB9B1]/35" : "border-white/10",
                  isTalkPressed
                    ? cn(
                      "text-emerald-100 shadow-[0_0_30px_rgba(16,185,129,0.15)]",
                      appMode === 'practice'
                        ? "bg-[#0FB9B1]/20 border-[#0FB9B1]/55"
                        : "bg-emerald-500/25 border-emerald-500/40"
                    )
                    : cn(
                      "bg-white/5 text-slate-200 hover:bg-white/10",
                      appMode === 'practice' ? "border-[#0FB9B1]/35" : "border-white/10"
                    )
                )}
              >
                FALAR
              </button>
            )}

            {/* PC Logo (Bottom Right) */}
            <div className="hidden md:flex justify-center items-center mt-auto pb-8 opacity-100">
              <Logo className="w-80 text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]" />
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}

export default App;
