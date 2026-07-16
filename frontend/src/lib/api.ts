import type { User } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

export async function registerUser(
  name: string,
  phone: string,
  api_key: string,
  instance_id: string
): Promise<User> {
  const res = await fetch(`${API_BASE}/api/users/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, phone, api_key, instance_id }),
  });
  if (!res.ok) {
    throw new Error(`Falha ao cadastrar: ${res.status}`);
  }
  return res.json();
}

export function buildWsUrl(phone: string): string {
  const wsBase = process.env.NEXT_PUBLIC_WS_BASE || "ws://localhost:8000";
  return `${wsBase}/ws/${phone}`;
}
