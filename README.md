# Basile — app de conversa com a igreja (PWA)

App web instalável (PWA) para quem não tem ou não quer usar o WhatsApp conversar com a igreja.
Do outro lado está o mesmo Basile do WhatsApp: mesmos agentes, mesma memória (a sessão é a mesma).

## Arquitetura

```
[App PWA (este repo)] ──HTTP + WebSocket──▶ [mensageiro (basile_ia/backend/mensageiro)] ──▶ Basile (orquestrador)
                                                    ▲                                          │
                                                    └──────── retorno assinado (callback) ◀────┘
```

- **Entrar**: usuário e senha são o CPF do cadastro da igreja (PROVISÓRIO, até combinar uma senha de verdade
  com o CRM).
  Se a pessoa estiver em mais de uma igreja, ela escolhe.
- **Conversa**: o token vai na primeira mensagem do WebSocket (nunca na URL). Tudo fica guardado:
  ao abrir o app, aparece o histórico.
- **PWA**: `public/manifest.webmanifest`, ícones e `public/sw.js` (abre rápido e sem internet).
  O service worker só é registrado no build de produção.

O backend antigo (pasta `backend/`, sem login) não é mais usado.

## Rodando localmente

Precisa do mensageiro rodando (no basile_ia: `docker compose up -d basile-mensageiro`, porta 8014).

```bash
cd frontend
npm install
NEXT_PUBLIC_API_BASE=http://localhost:8014 NEXT_PUBLIC_WS_BASE=ws://localhost:8014 npm run build
npx next start -p 3010
```

Abra http://localhost:3010 (a origem precisa estar em `MENSAGEIRO_ORIGENS`).

## Variáveis (no build)

| Variável | Exemplo | Para quê |
|---|---|---|
| `NEXT_PUBLIC_API_BASE` | `https://app-api.basileia.global` | endereço do mensageiro |
| `NEXT_PUBLIC_WS_BASE` | `wss://app-api.basileia.global` | WebSocket do mensageiro |

## Estrutura

```
frontend/
├── public/                    # manifesto, ícones, service worker
└── src/
    ├── app/                   # login (/) e conversa (/chat)
    ├── contexts/chat-context.tsx   # sessão, histórico, tempo real
    ├── components/            # login, janela, balões, campo de mensagem, registro do SW
    ├── lib/                   # cliente REST e WebSocket
    └── types/
```
