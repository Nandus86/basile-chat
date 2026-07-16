import os
from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from connection_manager import manager
from database import get_user_by_phone, init_db, register_user

BASILE_WEBHOOK_URL = os.getenv(
    "BASILE_WEBHOOK_URL",
    "https://basile.basileia.global/ingress-api/webhook/basile-chat",
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(title="BasileIA Messenger API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


class UserRegister(BaseModel):
    name: str
    phone: str
    api_key: str
    instance_id: str


class WebhookPayload(BaseModel):
    phone: str
    message: str


@app.post("/api/users/register")
async def api_register_user(payload: UserRegister):
    user = await register_user(payload.name, payload.phone, payload.api_key, payload.instance_id)
    return user


@app.get("/api/users/{phone}")
async def api_get_user(phone: str):
    user = await get_user_by_phone(phone)
    if user is None:
        return {"error": "user not found"}
    return user


@app.websocket("/ws/{phone}")
async def websocket_endpoint(websocket: WebSocket, phone: str):
    await manager.connect(phone, websocket)
    try:
        while True:
            data = await websocket.receive_json()
            if data.get("type") == "message":
                content = data.get("content", "")
                api_key = data.get("api_key", "")
                instance_id = data.get("instance_id", "")
                await forward_to_basile(phone, content, api_key, instance_id)
    except WebSocketDisconnect:
        manager.disconnect(phone)


async def forward_to_basile(
    phone: str, message: str, api_key: str, instance_id: str
) -> None:
    payload = {
        "phone": phone,
        "message": message,
        "api_key": api_key,
        "instance_id": instance_id,
    }
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(BASILE_WEBHOOK_URL, json=payload)
            print(f"[Basile] POST {BASILE_WEBHOOK_URL} -> {response.status_code}")
    except Exception as exc:
        print(f"[Basile] error forwarding message: {exc}")


@app.post("/webhook/receive")
async def webhook_receive(payload: WebhookPayload):
    delivered = await manager.send_message(payload.phone, payload.message)
    return {"ok": True, "delivered": delivered}


@app.get("/")
async def root():
    return {"status": "ok", "service": "BasileIA Messenger API"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
