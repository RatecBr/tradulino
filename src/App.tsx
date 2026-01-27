import { useRef, useEffect, useState } from 'react'
import { Mic, MicOff, Home } from 'lucide-react';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { useTranslation } from './hooks/useTranslation';
import { useAIResponse } from './hooks/useAIResponse';
import { TranscriptionPanel } from './components/TranscriptionPanel';
import { SuggestionDock } from './components/SuggestionDock';
import { cn } from './lib/utils';
import { Logo } from './components/Logo';
import { LandingPage } from './components/LandingPage';

function App() {
  const [showApp, setShowApp] = useState(false);

  const {
    isListening,
    currentInterim,
    history,
    startListening,
    stopListening,
    updateHistory,
    mode
  } = useSpeechRecognition();

  const { translateText } = useTranslation();
  const { suggestions, isLoading, generateSuggestions } = useAIResponse();

  // Track processed items to avoid re-fetching
  const processingRef = useRef<Set<string>>(new Set());

  // Reactive Effect: Monitor history for new finalized items
  useEffect(() => {
    const lastItem = history[history.length - 1];

    // Only process if it's a FINAL item we haven't touched yet
    if (lastItem && lastItem.isFinal && !processingRef.current.has(lastItem.id)) {

      // Mark as processed
      processingRef.current.add(lastItem.id);

      // 1. Generate suggestions with context
      generateSuggestions(lastItem.text, history);

      // 2. Translate
      translateText(lastItem.text).then(translation => {
        updateHistory(lastItem.id, { translation });
      });
    }
  }, [history, generateSuggestions, translateText, updateHistory]);

  if (!showApp) {
    return <LandingPage onStart={() => setShowApp(true)} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-primary/30 overflow-hidden relative">
      {/* Botão para voltar à Home */}
      <button 
        onClick={() => {
          if (isListening) stopListening();
          setShowApp(false);
        }}
        className="fixed top-6 left-6 z-[100] flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-all active:scale-95"
      >
        <Home className="w-4 h-4" />
        <span className="text-sm font-medium">Voltar à Home</span>
      </button>

      {/* Background Orbs */}
      <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] translate-x-1/2 translate-y-1/2 pointer-events-none" />

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
              lastUserSpeech={[...history].reverse().find(h => h.sender === 'user')?.text}
              mode={mode}
            />

            {/* Floating Mic Button (Fixed layout) */}
            <button
              onClick={isListening ? stopListening : startListening}
              className={cn(
                "fixed bottom-6 right-6 z-50 md:absolute md:bottom-8 md:right-8",
                "w-16 h-16 rounded-full transition-all duration-300 shadow-2xl border backdrop-blur-md flex items-center justify-center",
                "opacity-90 hover:opacity-100", // Semi-transparent request
                isListening
                  ? "bg-red-500/90 text-white animate-pulse border-red-400/50 shadow-red-900/50"
                  : "bg-emerald-500/80 text-white hover:bg-emerald-400/90 border-emerald-400/50 shadow-emerald-900/50"
              )}
            >
              {isListening ? <Mic className="w-8 h-8" /> : <MicOff className="w-8 h-8" />}
              {isListening && (
                <span className="absolute inset-0 rounded-full animate-ping bg-red-500/30" />
              )}
            </button>

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
