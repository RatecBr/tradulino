# 🦜 Tradulino

> **Seu Copiloto de Conversação Bilíngue.** Escuta, traduz e sugere o que falar em tempo real.

O Tradulino é uma ferramenta de IA projetada para ajudar você a manter conversas em inglês com total confiança. Ele atua como uma legenda inteligente que não apenas traduz o que os outros dizem, mas também sugere as melhores respostas para você brilhar na conversação.

---

## ✨ Funcionalidades Principais

*   **🎙️ Reconhecimento Híbrido**: Funciona nativamente no Chrome/Edge e via OpenAI Whisper em outros navegadores (Brave, Firefox, Safari, Mobile).
*   **🧠 Sugestões Contextuais**: Receba sugestões de respostas naturais baseadas no que está sendo dito.
*   **🇧🇷 Tradução em Tempo Real**: Entenda instantaneamente o contexto da conversa com traduções para o Português (Brasil).
*   **🎯 Feedback de Pronúncia**: O sistema analisa sua fala e destaca em vermelho palavras que precisam de melhoria na pronúncia.
*   **🏠 Landing Page Moderna**: Apresentação profissional do sistema com guia de uso.

---

## 🚀 Início Rápido

### Pré-requisitos
*   [Node.js](https://nodejs.org/) instalado.
*   Uma chave de API da [OpenAI](https://platform.openai.com/).

### Instalação

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/RatecBr/tradulino.git
    cd tradulino
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Configure as variáveis de ambiente:**
    Crie um arquivo `.env` na raiz do projeto:
    ```env
    OPENAI_API_KEY=sk-sua-chave-aqui...
    ```

4.  **Inicie o ambiente de desenvolvimento:**
    ```bash
    npm run dev
    ```
    *   **Frontend:** `http://localhost:5173`
    *   **Backend:** `http://localhost:8080`

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
*   **IA**: OpenAI (GPT-3.5 Turbo & Whisper-1).
*   **Voz**: Web Speech API.

---

2026 © Tradulino Team.
