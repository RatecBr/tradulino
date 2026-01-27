# 🛠️ Configuração e Deploy - Tradulino

Este guia detalha como configurar o Tradulino para desenvolvimento local e como realizar o deploy para produção.

---

## 💻 Configuração Local

### 1. Clonagem e Dependências
```bash
git clone https://github.com/RatecBr/tradulino.git
cd tradulino
npm install
```

### 2. Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto. O Tradulino usa tanto o frontend quanto o backend, então certifique-se de configurar a chave corretamente:

```env
# Chave da OpenAI para o Backend (Obrigatório para Whisper e Chat)
OPENAI_API_KEY=sk-your-key-here
```

### 3. Rodando em Desenvolvimento
```bash
npm run dev
```
Este comando utiliza o pacote `concurrently` para iniciar:
- **Vite** (Frontend) na porta `5173`.
- **Node Server** (Backend) na porta `8080`.

O Vite faz proxy automático de `/api/*` para `http://localhost:8080` (veja `vite.config.ts`).

---

## ☁️ Deploy em Produção (Vercel)

O Tradulino foi projetado para funcionar perfeitamente na **Vercel**.

### Passo 1: GitHub
Suba seu código para um repositório privado ou público no GitHub.

### Passo 2: Importar na Vercel
1. Vá ao dashboard da Vercel e clique em **"Add New > Project"**.
2. Importe o repositório do Tradulino.

### Passo 3: Variáveis de Ambiente
Nas configurações do projeto na Vercel (**Settings > Environment Variables**), adicione:
- `OPENAI_API_KEY`: Sua chave secreta da OpenAI.

### Passo 4: Configurações de Build
A Vercel detectará automaticamente o Vite. O arquivo `vercel.json` na raiz já configura as rotas para as Serverless Functions na pasta `/api`.

---

## 🔒 Segurança
- **Nunca** publique seu arquivo `.env` ou inclua chaves de API diretamente no código-fonte.
- O `.gitignore` já está configurado para ignorar o arquivo `.env`.
- No Tradulino, as chamadas para a OpenAI são feitas via backend (`/api`), o que mantém sua chave protegida e oculta do navegador do usuário final.

---

## 🗄️ Supabase (opcional)
Se você decidir adicionar persistência (histórico, usuários, preferências), Supabase é uma boa opção.

Importante: Supabase não resolve problemas de captura de áudio/transcrição; ele ajuda na camada de dados.

---

2026 © Tradulino Team.
