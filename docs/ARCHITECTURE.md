# Tradulino - Documentação de Arquitetura

## Visão Geral

O Tradulino é um assistente de conversação bilíngue projetado para auxiliar usuários com nível intermediário de inglês. Ele oferece:
1. **Diarização (Identificação de Voz):** Separa automaticamente a sua fala da fala do interlocutor.
2. **Tradução em Tempo Real:** Traduz o que é dito para Português (Brasil).
3. **Sugestões Contextuais (IA):** Sugere o que dizer em seguida usando Inteligência Artificial.
4. **Treino de Pronúncia:** Verifica se você pronunciou as sugestões corretamente.

Este documento detalha as decisões técnicas, a estrutura do projeto e como o sistema "Universal" funciona.

---

## 🏗️ Estrutura do Projeto

```
tradulino/
├── api/                  # Funções Serverless (Vercel)
│   ├── chat.ts           # Proxy para OpenAI Chat Completion
│   ├── transcribe.ts     # Proxy Serverless para OpenAI Whisper (Audio -> Texto)
│   └── translate.ts      # Proxy para Tradução Rápida
├── src/
│   ├── components/       # Interface do Usuário (UI)
│   │   ├── LandingPage.tsx   # Nova Home do sistema
│   │   ├── Logo.tsx          # Componente de marca unificado
│   │   ├── SuggestionDock.tsx  # Painel de sugestões + Indicador de Modo
│   │   ├── TranscriptionPanel.tsx # Balões de conversa
│   │   └── ...
│   ├── hooks/            # Lógica de Negócio (React Hooks)
│   │   ├── useAIResponse.ts       # Gera sugestões (GPT-3.5)
│   │   ├── useAudioRecorder.ts    # Gravação de áudio (fallback)
│   │   ├── useSpeechRecognition.ts # Cérebro Híbrido (Native vs Whisper)
│   │   └── useTranslation.ts      # Tradução de texto
│   └── App.tsx           # Entrada principal com roteamento de Landing Page
├── server.js             # Servidor Backend LOCAL (Porta 8080)
└── README.md             # Guia de Uso
```

---

## 🧠 Sistema de Reconhecimento Híbrido (Universal)

O maior desafio técnico foi garantir que o reconhecimento de voz funcionasse em **todos os navegadores**, já que a `Web Speech API` (gratuita e rápida) só existe no Google Chrome.

### Solução Implementada

O hook `useSpeechRecognition.ts` implementa uma estratégia de **Fallback Inteligente**:

1.  **Modo Nativo (⚡ Native)**:
    *   **Detecta:** Se `window.SpeechRecognition` existe (Chrome/Edge).
    *   **Funcionamento:** Transcrição em tempo real, sem custo, direto no navegador.
    *   **Latência:** Quase zero.

2.  **Modo Universal (🌐 Universal)**:
    *   **Detecta:** Se não há suporte nativo (Brave, Firefox, Safari, iOS).
    *   **Funcionamento:**
        *   Usa `MediaRecorder` para gravar o áudio do microfone.
        *   Cria "chunks" (pedaços) de áudio a cada 5 segundos.
        *   Envia para o endpoint `/api/transcribe`.
        *   O backend usa o modelo **Whisper-1** da OpenAI para transcrever com alta precisão.
    *   **Custo:** Consome créditos da API OpenAI.
    *   **Latência:** ~1-2 segundos após cada frase.

### Fluxo de Dados

1.  **Usuário Fala** -> `useSpeechRecognition` captura.
2.  **Texto Gerado** -> Adicionado ao `history` (Estado Global da Conversa).
3.  **Diarização Mágica**:
    *   Se houver uma pausa > 5 segundos, o sistema assume que o falante trocou (Voz 1 -> Voz 2).
    *   Pausas curtas (< 2.5s) apenas concatenam o texto no mesmo balão.
4.  **IA Reage**:
    *   O `App.tsx` observa mudanças no histórico.
    *   Chama `useTranslation` para traduzir o novo texto.
    *   Chama `useAIResponse` para gerar sugestões.

---

## 🚀 Backend Local vs Nuvem

Para garantir que o desenvolvimento seja idêntico à produção:

*   **Produção (Vercel):** As funções na pasta `/api` são implantadas automaticamente como *Serverless Functions*.
*   **Local (Server.js):** Criamos um servidor Express que roda na porta **8080** e **imita** exatamente o comportamento da Vercel. O comando `npm run dev` inicia tanto o Vite (Frontend) quanto este servidor.

---

## 🎨 Design System

*   **Framework:** TailwindCSS v4 (PostCSS).
*   **Tema:** Dark Mode profundo (`slate-950`).
*   **Componentes:** Glassmorphism (efeito vidro) e animações suaves com `framer-motion`.
*   **Logo**: SVG dinâmico e responsivo com suporte a animações de estado.

---

2026 © Tradulino Team.
