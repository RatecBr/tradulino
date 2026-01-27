import React from 'react';
import { Logo } from './Logo';

interface LandingPageProps {
  onStart: (mode: 'live' | 'practice') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 font-sans selection:bg-[#0A7CFF]/20 relative overflow-hidden">
      {/* Background Orbs para manter consistência com o App */}
      <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-[#0A7CFF]/10 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] translate-x-1/2 translate-y-1/2 pointer-events-none" />

      <div className="relative z-10">
        {/* Navbar */}
        <nav className="max-w-[1100px] mx-auto px-5 py-8 flex justify-between items-center">
          <Logo className="w-64 md:w-80" />
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => onStart('live')}
              className="bg-[#0A7CFF] text-white px-5 py-2.5 rounded-lg font-semibold transition-all hover:translate-y-[-2px] hover:shadow-[0_10px_30px_rgba(10,124,255,0.3)] active:scale-95"
            >
              Conversa real
            </button>
            <button
              onClick={() => onStart('practice')}
              className="bg-[#0FB9B1] text-white px-5 py-2.5 rounded-lg font-semibold transition-all hover:translate-y-[-2px] hover:shadow-[0_10px_30px_rgba(15,185,177,0.35)] active:scale-95"
            >
              Treinar com o Lino
            </button>
          </div>
        </nav>

        <header className="max-w-[1100px] mx-auto px-5 py-20 md:py-32 grid grid-cols-1 gap-10">
          <div className="max-w-[850px]">
            <h1 className="text-5xl md:text-7xl font-black leading-[1.1] mb-8 tracking-tight">
              Fale inglês com <span className="text-[#0A7CFF]">confiança</span>,<br/>
              mesmo sem dominar o idioma.
            </h1>

            <p className="text-xl md:text-2xl text-slate-400 leading-relaxed mb-10 max-w-[700px]">
              <strong className="text-slate-100">TRADULINO</strong> é o aplicativo web que escuta sua conversa em inglês, 
              traduz instantaneamente e sugere respostas inteligentes para você responder com segurança.
            </p>

            <div className="flex flex-wrap gap-4">
              <button 
                onClick={() => onStart('live')}
                className="bg-[#0A7CFF] text-white px-10 py-5 rounded-xl text-lg font-bold transition-all hover:translate-y-[-2px] hover:shadow-[0_10px_30px_rgba(10,124,255,0.4)] active:scale-95"
              >
                Conversa real
              </button>
              <button
                onClick={() => onStart('practice')}
                className="bg-[#0FB9B1] text-white px-10 py-5 rounded-xl text-lg font-bold transition-all hover:translate-y-[-2px] hover:shadow-[0_10px_30px_rgba(15,185,177,0.35)] active:scale-95"
              >
                Treinar com o Lino
              </button>
              <a 
                href="#como-funciona"
                className="border-2 border-slate-700 text-slate-300 px-10 py-5 rounded-xl text-lg font-bold transition-all hover:bg-white/5 hover:border-slate-500"
              >
                Ver como funciona
              </a>
            </div>
          </div>
        </header>

        <section className="max-w-[1100px] mx-auto px-5 py-24">
          <h2 className="text-3xl md:text-4xl font-bold mb-16 text-center md:text-left text-white">Por que o TRADULINO é diferente?</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "🎧 Escuta ativa",
                desc: "O sistema escuta a conversa em inglês em tempo real, sem necessidade de digitar nada."
              },
              {
                title: "⚡ Tradução instantânea",
                desc: "Tradução imediata do que foi dito, mantendo o contexto da conversa."
              },
              {
                title: "🎯 Feedback de Pronúncia",
                desc: "O TRADULINO analisa sua fala e destaca erros de pronúncia em tempo real para você melhorar."
              },
              {
                title: "💬 Respostas sugeridas",
                desc: "O sistema mostra opções de resposta para você escolher a melhor e responder com naturalidade."
              },
              {
                title: "📚 Aprendizado prático",
                desc: "Você aprende inglês enquanto conversa, em situações reais do dia a dia."
              },
              {
                title: "🚀 Confiança Total",
                desc: "Fale sem medo de errar, sabendo que o sistema está lá para te apoiar em cada palavra."
              }
            ].map((feature, i) => (
              <div key={i} className="bg-white/5 p-8 rounded-2xl border border-white/10 backdrop-blur-sm transition-all hover:bg-white/10 hover:border-white/20">
                <h3 className="text-xl font-bold mb-4 text-[#0A7CFF]">{feature.title}</h3>
                <p className="text-slate-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="como-funciona" className="max-w-[1100px] mx-auto px-5 py-24">
          <h2 className="text-3xl md:text-4xl font-bold mb-16 text-center md:text-left text-white">Como funciona</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                step: "1️⃣ Escute",
                desc: "O TRADULINO escuta o inglês falado na conversa."
              },
              {
                step: "2️⃣ Traduza",
                desc: "O conteúdo é traduzido instantaneamente para você entender o contexto."
              },
              {
                step: "3️⃣ Escolha",
                desc: "Sugestões de respostas aparecem na tela. Você escolhe a melhor."
              },
              {
                step: "4️⃣ Responda",
                desc: "Fale a resposta escolhida e siga a conversa sem travar."
              }
            ].map((item, i) => (
              <div key={i} className="p-8 border-l-4 border-[#0A7CFF] bg-white/5 rounded-r-xl backdrop-blur-sm">
                <h3 className="text-xl font-bold mb-4 text-white">{item.step}</h3>
                <p className="text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-[1100px] mx-auto px-5 py-12 mb-20">
          <div className="bg-gradient-to-br from-[#0A7CFF] to-[#0FB9B1] text-white rounded-[32px] px-8 py-20 text-center shadow-2xl relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-black mb-8 leading-tight tracking-tight">
                Inglês não é sobre decorar.<br/>
                É sobre se comunicar.
              </h2>

              <p className="text-lg md:text-xl text-white/90 max-w-[700px] mx-auto mb-12">
                Com o TRADULINO, você pratica inglês do jeito certo: 
                ouvindo, entendendo e respondendo em tempo real.
              </p>

              <button 
                onClick={() => onStart('live')}
                className="bg-white text-[#0A7CFF] px-12 py-5 rounded-xl text-xl font-extrabold transition-all hover:translate-y-[-2px] hover:shadow-2xl active:scale-95"
              >
                Quero usar o TRADULINO
              </button>
            </div>
            {/* Efeito de luz no card final */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2" />
          </div>
        </section>

        <footer className="text-center py-12 text-slate-500 text-sm border-t border-white/5">
          © 2026 – TRADULINO • Tradução e prática de inglês em tempo real
        </footer>
      </div>
    </div>
  );
};
