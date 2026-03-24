# 🦜 Tradulino

> **Seu Copiloto de Conversação Bilíngue.** Escuta, traduz e sugere o que falar em tempo real.

O Tradulino é uma ferramenta de IA projetada para ajudar você a manter conversas em inglês com total confiança. Ele atua como uma legenda inteligente que não apenas traduz o que os outros dizem, mas também sugere as melhores respostas para você brilhar na conversação.

---

## ✨ Funcionalidades Principais

*   **🗣️ 2 Modos**:
    *   **Conversa real (2 pessoas)**: o app não “conversa sozinho”; ele transcreve/ traduz e sugere o que VOCÊ pode responder.
    *   **Treinar com o Lino**: o app pode responder automaticamente (opcional) para praticar.
*   **🎙️ Voz com Push-to-talk (FALAR)**: o app só grava/transcreve enquanto você segura **FALAR** (evita “inventar” texto com ruído/eco).
*   **🧠 Sugestões Contextuais (2 opções)**: sugestões curtas e objetivas para não ocupar espaço no mobile.
*   **🇧🇷 Tradução em Tempo Real**: traduz o texto transcrito para Português (Brasil).
*   **✅ Correção de frase (comparação)**: destaca o quanto sua fala ficou próxima da sugestão anterior (não é análise de pronúncia).
*   **📱 Mobile-first**: layout otimizado para celular/tablet (mic discreto, botão FALAR grande).

---

### 🚀 Início Rápido

1.  **Instale as dependências:** `npm install`
2.  **Configure o `.env`**: `OPENAI_API_KEY=sk-...`
3.  **Inicie o ambiente:** `npm run dev`
    *   **Frontend:** `http://localhost:8080`
    *   **Backend:** `http://localhost:8081`

---

## ⚡ Performance e Confiabilidade (V4)

O Tradulino foi otimizado para sessões longas e uso intenso:
*   **Janela de Contexto**: Mantém apenas as últimas 50 mensagens na memória ativa para evitar travamentos.
*   **Memoização UI**: Bolhas de conversa "congeladas" para economia de CPU/Bateria.
*   **Gestão de Threads**: AbortControllers centralizados para evitar conflitos de IA.

---

## 📂 Documentação Completa

Para uma imersão mais profunda no Tradulino, consulte nossos guias detalhados:

1.  📖 [**Guia do Usuário**](./docs/USER_GUIDE.md) - Como aproveitar todas as funções.
2.  🏗️ [**Arquitetura do Sistema**](./docs/ARCHITECTURE.md) - Detalhes técnicos e estrutura.
3.  🌐 [**Documentação de API**](./docs/API.md) - Endpoints e integração.
4.  🛠️ [**Configuração e Deploy**](./docs/SETUP.md) - Guia passo a passo para colocar online.

---

## 🛠️ Tecnologias Utilizadas

*   **Frontend**: React, Vite, TypeScript, TailwindCSS, Framer Motion.
*   **Backend**: Node.js, Express (Local) / Vercel Serverless Functions (Nuvem).
*   **IA**: OpenAI (Chat + Whisper).
*   **Voz**: MediaRecorder + transcrição via Whisper (Modo Universal).

---

2026 © Tradulino Team.
