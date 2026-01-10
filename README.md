# 🦜 Tradulino - Seu Copiloto de Conversação Bilíngue

Bem-vindo à documentação oficial do **Tradulino**. Este software foi desenhado para ser uma "muleta inteligente" para quem tem inglês intermediário e precisa de segurança extra em reuniões ou conversas casuais.

## 🌟 Visão Geral

O Tradulino não é apenas um tradutor. É um **Assistente de Conversação Ativo**.
Ele escuta a conversa, identifica quem está falando, traduz em tempo real e, o mais importante, **sugere o que você deve dizer em seguida**, mantendo o contexto do assunto.

### Diferenciais Chave
1.  **Diarização Visual Híbrida**: Identifica automaticamente a troca de falantes por tempo de pausa, mas permite correção manual (clique no balão) para precisão absoluta.
2.  **Contexto Temporal e Histórico**: A IA sabe que dia e hora são hoje e lê as últimas frases da conversa para evitar sugestões desconexas.
3.  **Sugestões Bilíngues**: As sugestões de resposta aparecem em Inglês (para você ler) e Português (para você ter certeza do significado).
4.  **Resiliente (Always On)**: O microfone reinicia automaticamente se cair, garantindo que você nunca perca uma frase.

---

## 🛠️ Arquitetura Técnica

### Stack Tecnológica
*   **Web Framework**: React (Vite) + TypeScript.
*   **Audio Engine**: Web Speech API (Nativa do Browser) para transcrição local e rápida.
*   **Inteligência Artificial**: OpenAI GPT-3.5-Turbo (via REST API) para tradução contextual e geração de sugestões.
*   **Estilização**: Tailwind CSS com foco em design moderno (Glassmorphism, Dark Mode).

### Fluxo de Dados
1.  **Captura**: `useSpeechRecognition.ts` captura o áudio.
2.  **Processamento**:
    *   **Fusão**: Se a pausa for curta (<2.5s), o texto é fundido ao balão anterior.
    *   **Separação**: Se a pausa for longa (>5s), um novo balão (Voz 2) é criado.
3.  **Inteligência**:
    *   Otexto finalizado é enviado ao `useTranslation` (para tradução PT-BR).
    *   O histórico recente + contexto temporal é enviado ao `useAIResponse` (para sugestões).
4.  **Interface**: O `TranscriptionPanel` renderiza a conversa e permite interação (clique para trocar voz).

---

---

## 🚀 Como Rodar

### Pré-requisitos
*   Node.js (v18 ou superior)
*   Chave de API da OpenAI (necessária para tradução e sugestões)

### Instalação
1.  Clone o repositório.
2.  Instale as dependências:
    ```bash
    npm install
    ```
3.  Configure a API Key:
    *   Crie um arquivo `.env` na raiz.
    *   Adicione: `VITE_OPENAI_API_KEY=sk-sua-chave-aqui`

### Execução
```bash
npm run dev
```
Acesse `http://localhost:5173`.

---

## ☁️ Deploy na Vercel

O Tradulino está pronto para rodar na nuvem. A Vercel é a plataforma recomendada.

1.  Dê push deste código para o seu GitHub.
2.  Acesse [Vercel.com](https://vercel.com) e clique em "Add New Helper" -> "Project".
3.  Importe o repositório do Tradulino.
4.  Na tela de configuração (Configure Project):
    *   **Framework Preset**: Vite (deve detectar automaticamente).
    *   **Environment Variables**: Adicione `VITE_OPENAI_API_KEY` com o valor da sua chave OpenAI.
5.  Clique em **Deploy**.

> **⚠️ Importante**: A `Web Speech API` (reconhecimento de voz) exige **HTTPS** para funcionar em dispositivos móveis ou fora do localhost. A Vercel fornece HTTPS automaticamente no domínio gerado (`sua-app.vercel.app`), então tudo funcionará perfeitamente.

---

## 🧠 Inteligência de Contexto

O sistema agora possui uma memória de curto prazo. Ao gerar sugestões, ele envia para a IA:
1.  **Contexto Real**: "Hoje é Sábado, 17:30".
2.  **Histórico**: As últimas 6 trocas de mensagens (ex: Voce: "Oi", Outro: "Tudo bem?").

Isso permite que, se você estiver falando sobre *Viagens*, a IA não sugira respostas sobre *Clima*, a menos que faça sentido no fluxo.

---

## 🎯 Treinador de Pronúncia (Novo!)

O Tradulino agora escuta ativamente se você está tentando falar uma das frases sugeridas:
*   **Highlight Amarelo**: As palavras que você pronunciou corretamente ficam amarelas em tempo real dentro da sugestão.
*   **Feedback Visual**: Se você falar "Yes I do" e a sugestão for "Yes, I do.", o sistema entende a intenção e marca como sucesso, ajudando você a treinar a pronúncia correta.
*   **Tecnologia Híbrida**: Usa algoritmos de *Jaccard Similarity* (palavras) e *Dice Coefficient* (sons) para tolerar pequenos erros de "ouvido" da IA e focar na sua fluência.

---

## 🎨 Guia de Uso (UX)

*   **Microfone Pulsando**: O sistema está ouvindo.
*   **Balão Azul (Esquerda)**: Voz 1 (Geralmente o interlocutor ou quem começou).
*   **Balão Verde (Direita)**: Voz 2 (Você ou a outra pessoa).
*   **Errou a voz?**: Clique em qualquer balão para trocar a cor/dono instantaneamente.
*   **Precisa responder?**: Olhe para o painel lateral. Escolha uma das 3 opções e fale. Se a borda ficar amarela, parabéns! Você acertou a pronúncia.

---

*Desenvolvido com foco em agilidade, privacidade e design.*
