# 🌐 Documentação de API - Tradulino

Esta documentação detalha os endpoints disponíveis no Tradulino, utilizados para transcrição, tradução e geração de sugestões via IA.

## Configuração de Base
As chamadas de API são feitas para o backend que atua como um proxy seguro para a OpenAI.
- **Ambiente Local**: `http://localhost:8080/api`
- **Produção (Vercel)**: `/api` (relativo)

---

## 1. Chat e Sugestões
Gera sugestões de respostas baseadas no histórico da conversa.

- **Endpoint**: `/chat`
- **Método**: `POST`
- **Corpo da Requisição**:
  ```json
  {
    "messages": [
      { "role": "system", "content": "Contexto do sistema..." },
      { "role": "user", "content": "Olá, como vai?" }
    ]
  }
  ```
- **Resposta de Sucesso (200 OK)**: Retorna o objeto completo da OpenAI Chat Completion API.

---

## 2. Tradução Rápida
Traduz pequenos blocos de texto do Inglês para o Português (Brasil).

- **Endpoint**: `/translate`
- **Método**: `POST`
- **Corpo da Requisição**:
  ```json
  {
    "text": "Hello, how are you today?"
  }
  ```
- **Resposta de Sucesso (200 OK)**:
  ```json
  {
    "translation": "Olá, como você está hoje?"
  }
  ```

---

## 3. Transcrição (Modo Universal)
Utilizado para transcrever áudio em navegadores que não suportam a Web Speech API nativa. Usa o modelo Whisper-1.

- **Endpoint**: `/transcribe`
- **Método**: `POST`
- **Corpo da Requisição**:
  ```json
  {
    "audio": "BASE64_ENCODED_AUDIO_STRING"
  }
  ```
- **Resposta de Sucesso (200 OK)**:
  ```json
  {
    "text": "The transcribed text from the audio."
  }
  ```

---

## Tratamento de Erros
Todos os endpoints retornam códigos de status HTTP padrão:
- `400 Bad Request`: Parâmetros ausentes ou inválidos.
- `405 Method Not Allowed`: Uso de métodos diferentes de `POST`.
- `500 Internal Server Error`: Falha na comunicação com a OpenAI ou erro de configuração no servidor (ex: API Key ausente).

---

2026 © Tradulino Team.
