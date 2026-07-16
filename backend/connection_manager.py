from fastapi import WebSocket


class ConnectionManager:
    def __init__(self) -> None:
        self._connections: dict[str, WebSocket] = {}

    async def connect(self, phone: str, websocket: WebSocket) -> None:
        await websocket.accept()
        if phone in self._connections:
            old = self._connections[phone]
            try:
                await old.close(code=1000)
            except Exception:
                pass
        self._connections[phone] = websocket

    def disconnect(self, phone: str) -> None:
        self._connections.pop(phone, None)

    def get_connection(self, phone: str) -> WebSocket | None:
        return self._connections.get(phone)

    async def send_message(self, phone: str, message: str) -> bool:
        ws = self._connections.get(phone)
        if ws is None:
            return False
        try:
            await ws.send_json({"type": "message", "sender": "basile", "content": message})
            return True
        except Exception:
            self._connections.pop(phone, None)
            return False


manager = ConnectionManager()
