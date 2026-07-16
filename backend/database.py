import aiosqlite

import os

DB_PATH = os.getenv("DB_PATH", "data/basile.db")


async def init_db() -> None:
    db_dir = os.path.dirname(DB_PATH)
    if db_dir:
        os.makedirs(db_dir, exist_ok=True)
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("PRAGMA journal_mode=WAL")
        await db.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                phone TEXT UNIQUE NOT NULL,
                api_key TEXT,
                instance_id TEXT,
                created_at TEXT NOT NULL DEFAULT (datetime('now'))
            )
            """
        )
        await _ensure_column(db, "api_key", "TEXT")
        await _ensure_column(db, "instance_id", "TEXT")
        await db.commit()


async def _ensure_column(db: aiosqlite.Connection, column: str, col_type: str) -> None:
    cursor = await db.execute(f"PRAGMA table_info(users)")
    cols = [row[1] for row in await cursor.fetchall()]
    if column not in cols:
        await db.execute(f"ALTER TABLE users ADD COLUMN {column} {col_type}")


async def register_user(name: str, phone: str, api_key: str, instance_id: str) -> dict:
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "INSERT INTO users (name, phone, api_key, instance_id) VALUES (?, ?, ?, ?) "
            "ON CONFLICT(phone) DO UPDATE SET name=excluded.name, "
            "api_key=excluded.api_key, instance_id=excluded.instance_id",
            (name, phone, api_key, instance_id),
        )
        await db.commit()
        cursor = await db.execute(
            "SELECT id, name, phone, api_key, instance_id, created_at FROM users WHERE phone = ?",
            (phone,),
        )
        row = await cursor.fetchone()
        return {
            "id": row[0],
            "name": row[1],
            "phone": row[2],
            "api_key": row[3],
            "instance_id": row[4],
            "created_at": row[5],
        }


async def get_user_by_phone(phone: str) -> dict | None:
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(
            "SELECT id, name, phone, api_key, instance_id, created_at FROM users WHERE phone = ?",
            (phone,),
        )
        row = await cursor.fetchone()
        if row is None:
            return None
        return {
            "id": row[0],
            "name": row[1],
            "phone": row[2],
            "api_key": row[3],
            "instance_id": row[4],
            "created_at": row[5],
        }
