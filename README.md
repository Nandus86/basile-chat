# BasileIA Messenger

Aplicação web de chat que conecta usuários à IA **Basile** via WebSocket em tempo real.

## Arquitetura

```
[Next.js Frontend] ──WebSocket──▶ [FastAPI Backend] ──HTTP POST──▶ [Basile Webhook]
                                          ▲                               │
                                   [SQLite DB]                          │
                                  (users table)                         │
                                          ▲                              │
                              POST /webhook/receive ◀───────────────────┘
                              {phone, message}
```

### Fluxo
1. **Usuário envia mensagem**: Frontend → WS → Backend → POST para o webhook do Basile (`{phone, message}`)
2. **Basile responde**: Basile → POST no webhook reverso do Backend (`{phone, message}`) → Backend localiza a conexão WS pelo telefone → entrega ao usuário

## Rodando com Docker (localhost)

Pré-requisito: Docker + Docker Compose instalados.

```bash
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- Docs da API: http://localhost:8000/docs

## Desenvolvimento local (sem Docker)

### Backend (FastAPI)
```bash
cd backend
pip install -r requirements.txt
python main.py
```

### Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```

## Endpoints do Backend

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/api/users/register` | Cadastra usuário `{name, phone}` |
| `GET` | `/api/users/{phone}` | Busca usuário por telefone |
| `WS` | `/ws/{phone}` | Conexão WebSocket para mensagens em tempo real |
| `POST` | `/webhook/receive` | Webhook reverso para respostas do Basile `{phone, message}` |

## Configuração

| Variável | Default | Descrição |
|----------|---------|-----------|
| `BASILE_WEBHOOK_URL` | URL de produção do Basile | Endpoint para onde o backend envia as mensagens |
| `DB_PATH` | `data/basile.db` | Caminho do banco SQLite |
| `NEXT_PUBLIC_API_BASE` | `http://localhost:8000` | URL do backend (frontend) |
| `NEXT_PUBLIC_WS_BASE` | `ws://localhost:8000` | URL do WebSocket (frontend) |

## Testando o webhook reverso

Com o backend rodando e um cliente WS conectado ao `/ws/{phone}`, simule uma resposta do Basile:

```bash
curl -X POST http://localhost:8000/webhook/receive \
  -H "Content-Type: application/json" \
  -d "{\"phone\":\"5511999999999\",\"message\":\"Olá! Sou a Basile.\"}"
```

A mensagem deve aparecer instantaneamente no chat do usuário conectado.

## Estrutura

```
basile-chat/
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
│   ├── main.py              # FastAPI app
│   ├── database.py           # SQLite (users)
│   ├── connection_manager.py # Registro de conexões WS
│   └── requirements.txt
└── frontend/
    ├── Dockerfile
    └── src/
        ├── app/
        │   ├── layout.tsx        # Layout raiz + ChatProvider
        │   ├── page.tsx          # Tela de login
        │   └── chat/page.tsx     # Tela do chat
        ├── contexts/
        │   └── chat-context.tsx  # Estado + WS + mensagens
        ├── components/
        │   ├── login-form.tsx
        │   ├── chat-window.tsx
        │   ├── chat-bubble.tsx
        │   └── message-input.tsx
        ├── lib/
        │   ├── ws-client.ts      # Cliente WebSocket com reconexão
        │   └── api.ts            # Cliente REST
        └── types/
            └── index.ts
```
