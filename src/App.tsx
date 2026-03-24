import { useRef, useEffect, useState } from "react";
import { Home } from "lucide-react";
import { useSpeechRecognition } from "./hooks/useSpeechRecognition";
import { useTranslation } from "./hooks/useTranslation";
import { useAIResponse } from "./hooks/useAIResponse";
import { useAIAutoReply } from "./hooks/useAIAutoReply";
import { TranscriptionPanel } from "./components/TranscriptionPanel";
import { SuggestionDock } from "./components/SuggestionDock";
import { cn } from "./lib/utils";
import { Logo } from "./components/Logo";
import { LandingPage } from "./components/LandingPage";

function App() {
  const [appMode, setAppMode] = useState<"live" | "practice" | null>(null);
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
    mode,
  } = useSpeechRecognition({
    sessionMode: appMode === "practice" ? "practice" : "live",
  });

  const { translateText } = useTranslation();
  const { suggestions, isLoading, status, generateSuggestions, resetSuggestions } =
    useAIResponse();
  const { generateReply } = useAIAutoReply();

  // Track processed items to avoid re-fetching
  const processedRef = useRef<Map<string, string>>(new Map());
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());
  const suggestionsAbortControllerRef = useRef<AbortController | null>(null);

  // Reactive Effect: Monitor history for new finalized items
  useEffect(() => {
    // Process only the last 10 items to prevent O(n^2) scaling issues
    const recentHistory = history.slice(-10);

    recentHistory.forEach((item) => {
      const lastProcessedText = processedRef.current.get(item.id);
      
      // If text has changed and it's final
      if (item.isFinal && lastProcessedText !== item.text) {
        // Debounce: Significant update check (e.g. text length increased by 5+ or first time)
        const isInitial = lastProcessedText === undefined;
        const isSignificant = !lastProcessedText || (item.text.length - lastProcessedText.length > 5);
        if (!isInitial && !isSignificant) return;

        // Abort previous tasks for this ID if they exist
        abortControllersRef.current.get(item.id)?.abort();
        const controller = new AbortController();
        abortControllersRef.current.set(item.id, controller);

        // Mark as processed with current text
        processedRef.current.set(item.id, item.text);

        // 1. Generate suggestions when the partner speaks
        if (item.sender === "other") {
          suggestionsAbortControllerRef.current?.abort();
          const suggestionsController = new AbortController();
          suggestionsAbortControllerRef.current = suggestionsController;
          generateSuggestions(item.text, history, suggestionsController.signal);
        }

        // 2. Translate
        translateText(item.text, controller.signal).then((translation) => {
          if (!controller.signal.aborted && translation) {
            updateHistory(item.id, { translation });
          }
        });

        // 3. Auto-reply only in Practice mode
        if (
          appMode === "practice" &&
          autoReplyEnabled &&
          item.sender === "user"
        ) {
          generateReply(item.text, history, controller.signal).then((reply) => {
            if (!controller.signal.aborted && reply) {
              addUtterance(reply, "other");
            }
          });
        }
      }
    });

    // Cleanup: we don't necessarily want to abort everything on every effect run,
    // but we should eventually clear old controllers if they are done.
  }, [
    history,
    generateSuggestions,
    translateText,
    updateHistory,
    generateReply,
    addUtterance,
    appMode,
    autoReplyEnabled,
  ]);

  if (!appMode) {
    return (
      <LandingPage
        onStart={(selectedMode) => {
          setAppMode(selectedMode);
          processedRef.current.clear();
          abortControllersRef.current.forEach(c => c.abort());
          abortControllersRef.current.clear();
          setAutoReplyEnabled(true);
          resetTranscript();
          resetSuggestions();
          setActiveSpeaker(selectedMode === "practice" ? "user" : "other");

          if (selectedMode === "practice") {
            // Give time for state to settle
            setTimeout(() => {
              addUtterance("Hello! I am Lino, your conversation coach. Ready to practice English?", "other");
            }, 800);
          }
        }}
      />
    );
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

      {appMode === "practice" && (
        <div className="fixed top-6 right-6 z-[100] flex items-center gap-3">
          <button
            onClick={() => setAutoReplyEnabled((v) => !v)}
            className={cn(
              "px-3 py-2 border rounded-full text-xs font-semibold transition-all",
              autoReplyEnabled
                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-200 hover:bg-emerald-500/25"
                : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10",
            )}
          >
            {autoReplyEnabled ? "Bot: ON" : "Bot: OFF"}
          </button>
        </div>
      )}

      {/* Background Orbs */}
      <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] translate-x-1/2 translate-y-1/2 pointer-events-none" />
      {appMode === "practice" && (
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
              updateHistory(id, {
                sender: currentSender === "user" ? "other" : "user",
              });
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
              status={status}
              lastUserSpeech={
                [...history]
                  .reverse()
                  .find((h) => h.sender === "user" && h.isFinal)?.text
              }
              mode={mode}
              accent={appMode === "practice" ? "lino" : "primary"}
              onSelect={(text) => addUtterance(text, "user")}
              mobileTopRight={
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border",
                      isTalkPressed
                        ? "bg-emerald-900/30 text-emerald-300 border-emerald-500/20"
                        : "bg-white/5 text-slate-300 border-white/10",
                    )}
                  >
                    {isTalkPressed ? "Falando" : isListening ? "Escutando..." : "Segure FALAR"}
                  </span>
                </div>
              }
            />

            {(appMode === "live" || appMode === "practice") && (
              <button
                onPointerDown={(e) => {
                  try {
                    (e.currentTarget as HTMLElement).setPointerCapture(
                      e.pointerId,
                    );
                  } catch {
                    /* empty */
                  }
                  setIsTalkPressed(true);
                  beginUserTalk();
                  if (!isListening) startListening();
                }}
                onPointerUp={(e) => {
                  try {
                    (e.currentTarget as HTMLElement).releasePointerCapture(
                      e.pointerId,
                    );
                  } catch {
                    /* empty */
                  }
                  setIsTalkPressed(false);
                  endUserTalk();
                }}
                onPointerCancel={(e) => {
                  try {
                    (e.currentTarget as HTMLElement).releasePointerCapture(
                      e.pointerId,
                    );
                  } catch {
                    /* empty */
                  }
                  setIsTalkPressed(false);
                  endUserTalk();
                }}
                className={cn(
                  "mt-4 md:mt-6 w-full rounded-2xl border text-center font-black tracking-widest select-none touch-none",
                  "py-6 md:py-5 text-3xl md:text-2xl transition-all active:scale-[0.99]",
                  appMode === "practice"
                    ? "border-[#0FB9B1]/35"
                    : "border-white/10",
                    isTalkPressed
                      ? cn(
                          "text-emerald-100 shadow-[0_0_30px_rgba(16,185,129,0.15)]",
                          appMode === "practice"
                            ? "bg-[#0FB9B1]/20 border-[#0FB9B1]/55"
                            : "bg-emerald-500/25 border-emerald-500/40",
                        )
                      : isListening 
                        ? cn(
                          "bg-indigo-500/10 text-indigo-200 border-indigo-500/30",
                          "hover:bg-indigo-500/15"
                        )
                        : cn(
                          "bg-white/5 text-slate-200 hover:bg-white/10",
                          appMode === "practice"
                            ? "border-[#0FB9B1]/35"
                            : "border-white/10",
                        ),
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
