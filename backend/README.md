# BasileIA Messenger - Backend

FastAPI backend with WebSocket support and reverse webhook for Basile integration.

## Setup

```bash
cd backend
pip install -r requirements.txt
python main.py
```

Server runs on `http://localhost:8000`.

## Endpoints

- `POST /api/users/register` - Register a user `{name, phone}`
- `GET /api/users/{phone}` - Lookup user by phone
- `WS /ws/{phone}` - WebSocket connection for real-time messaging
- `POST /webhook/receive` - Reverse webhook for Basile responses `{phone, message}`

## Configuration

Set the Basile webhook URL via environment variable (defaults to production URL):

```bash
set BASILE_WEBHOOK_URL=https://your-basile-endpoint/webhook
```
