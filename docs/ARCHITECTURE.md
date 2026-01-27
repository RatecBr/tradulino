# Tradulino - Documentação de Arquitetura

## Visão Geral

O Tradulino é um assistente de conversação bilíngue projetado para auxiliar usuários com nível intermediário de inglês. Ele oferece:
1. **2 Modos de uso:** Conversa real (2 pessoas) e Treinar com o Lino.
2. **Transcrição (Whisper):** Converte áudio em texto de forma consistente em mobile/desktop.
3. **Tradução em Tempo Real:** Traduz para Português (Brasil).
4. **Sugestões Contextuais (IA):** Sugere o que dizer em seguida.
5. **Correção de frase (comparação):** Compara sua fala com a sugestão anterior (não é pronúncia).

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

O maior desafio técnico é garantir que o reconhecimento de voz funcione de forma previsível em **celular/tablet**, onde a Web Speech API varia muito por navegador/dispositivo.

### Solução Implementada

O hook `useSpeechRecognition.ts` implementa o **Modo Universal**:

*   **Funcionamento:**
    *   Usa `MediaRecorder` para gravar o áudio do microfone.
    *   A gravação é controlada por **push-to-talk** (FALAR): não há escuta contínua em background.
    *   Segmenta em pedaços curtos (chunks) e envia para `/api/transcribe`.
    *   O backend envia o arquivo para o modelo **Whisper** e retorna `text`.
*   **Custo:** Consome créditos da API OpenAI.
*   **Latência:** Tipicamente ~1–2 segundos depois do chunk (varia com rede e tamanho do áudio).

### Separação de falantes (Conversa real)

Em Conversa real, o sistema não faz diarização automática (isso exigiria modelos/infra dedicados).

*   **Push-to-talk:** segurando **FALAR**, o falante vira “Você”; ao soltar, volta para “Outra pessoa”.
*   Como não há escuta contínua, o sistema evita transcrições “inventadas” por ruído/eco quando você não está falando.

### Fluxo de Dados

1.  **Usuário Fala** -> `useSpeechRecognition` captura.
2.  **Texto Gerado** -> Adicionado ao `history` (Estado Global da Conversa).
3.  **Falante**:
    *   No modo Conversa real, o falante é controlado pelo push-to-talk (FALAR).
    *   Em Treinar com o Lino, o usuário fala com push-to-talk e o Lino responde 1x por interação (opcional).
4.  **IA Reage**:
    *   O `App.tsx` observa mudanças no histórico.
    *   Chama `useTranslation` para traduzir o novo texto.
    *   Chama `useAIResponse` para gerar sugestões.

### Tamanho das respostas (curtas)

Para manter o app legível no mobile, o frontend:

*   Ajusta os prompts para respostas curtas (Bot e sugestões).
*   Envia parâmetros `max_tokens` e `temperature` para `/api/chat` quando necessário.

---

## 🚀 Backend Local vs Nuvem

Para garantir que o desenvolvimento seja idêntico à produção:

*   **Produção (Vercel):** As funções na pasta `/api` são implantadas automaticamente como *Serverless Functions*.
*   **Local (Server.js):** Criamos um servidor Express que roda na porta **8080** e **imita** exatamente o comportamento da Vercel. O comando `npm run dev` inicia tanto o Vite (Frontend) quanto este servidor.

---

## 🧾 Persistência (Supabase) — quando faz sentido?

Adicionar um banco (ex.: Supabase) é útil para:

*   **Histórico de conversas** (salvar/consultar por data, tema, etc.).
*   **Usuários, login e preferências** (idioma, modo padrão, configurações do mic).
*   **Analytics** (uso, taxa de acerto de correções, custo por sessão, etc.).

O que Supabase **não resolve**:

*   **Corte prematuro de frases longas** no FALAR.
*   **Latência de transcrição** ou qualidade do áudio.

Esses pontos são resolvidos no pipeline de áudio (captura/segmentação/eco/noise) e na lógica do push-to-talk.

---

## 🎨 Design System

*   **Framework:** TailwindCSS v4 (PostCSS).
*   **Tema:** Dark Mode profundo (`slate-950`).
*   **Componentes:** Glassmorphism (efeito vidro) e animações suaves com `framer-motion`.
*   **Logo**: SVG dinâmico e responsivo com suporte a animações de estado.

---

2026 © Tradulino Team.
