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
    ],
    "temperature": 0.7,
    "max_tokens": 150
  }
  ```
- **Resposta de Sucesso (200 OK)**: Retorna o objeto completo da OpenAI Chat Completion API.

### Observações importantes
* `temperature` e `max_tokens` são opcionais; o backend aplica limites seguros.
* O frontend usa esses campos para manter as respostas do Lino e as sugestões mais curtas.

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
    "audio": "BASE64_ENCODED_AUDIO_STRING",
    "mimeType": "audio/webm"
  }
  ```
- **Resposta de Sucesso (200 OK)**:
  ```json
  {
    "text": "The transcribed text from the audio."
  }
  ```

### Observações importantes
* `audio` deve ser um arquivo de áudio completo em base64 (não “pedaços crus” sem container).
* `mimeType` ajuda o backend a anexar o tipo e extensão corretos ao upload do Whisper.

---

## Tratamento de Erros
Todos os endpoints retornam códigos de status HTTP padrão:
- `400 Bad Request`: Parâmetros ausentes ou inválidos.
- `405 Method Not Allowed`: Uso de métodos diferentes de `POST`.
- `500 Internal Server Error`: Falha na comunicação com a OpenAI ou erro de configuração no servidor (ex: API Key ausente).

### Erros comuns
* `Invalid file format`: o áudio enviado não está em um container aceito (webm/ogg/wav/…).
* `net::ERR_ABORTED` no browser: normalmente aparece quando a requisição foi cancelada ou falhou ao enviar o áudio; verifique os logs do backend e a rede.

---

2026 © Tradulino Team.
